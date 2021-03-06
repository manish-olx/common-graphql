const utill = require(__dirname + '/../common/utill.js')

const resolvers =  {
    Query: {
        getChatData: (parent, args, headers) => {

            const { ad_id, peer_id, user_id, question_categories_list, pricing_categories_list, sitecode } = args
            let chatDataResponseObj = {};

            let gatewayUrl = null
            let xchatDomainUrl = null
            let supportedSitecode = ["olxin"]
            switch (sitecode) {
                case `olxin`:
                    gatewayUrl = `https://api.olx.in`;
                    xchatDomainUrl = `https://xchat.olx.in`;
                    break;
            }
            if (typeof sitecode === 'undefined' || !supportedSitecode.includes(sitecode)) {
                let err = utill.setErrorData('Sitecode not supported', 400)
                return err
            }
            const adUrl = gatewayUrl + `/api/v2/items/${ad_id}`
            const adPhoneUrl = gatewayUrl + `/api/v2/items/${ad_id}/params?filter=ad_phone`
            const peerUrl = gatewayUrl + `/api/v1/users/${peer_id}`
            let questionUrl = xchatDomainUrl + `/user/questions?ad_id=${ad_id}&category_id={category-id}&peer_id=${peer_id}&sender_type={sender-type}`
            let pricingUrl = xchatDomainUrl + `/user/pricing?ad_id=${ad_id}`
            let peerInfo = utill.fetchURL(peerUrl, 'GET', headers)

            //Ad info
            const adObj = utill.fetchURL(adUrl, 'GET' ,headers).then(adRes => {
                if (user_id != adRes.data.user_id) {
                    peerInfo.then(peerRes => {
                        if (peerRes.data.is_phone_visible === true && adRes.data.has_phone_param === true) {
                            adRes.data.phone = utill.fetchURL(adPhoneUrl, 'GET', headers).then(adPhoneRes => {
                                return adPhoneRes.data.ad_phone
                            })
                        }
                    })
                }
                return adRes
            })

            /** For ad */
            chatDataResponseObj.ad = adObj.then(res => utill.getResolvedData(res))

            /** For Pricing */
            chatDataResponseObj.pricing = adObj.then(res => {
                let pricingInfo = {}
                if (pricing_categories_list.includes(res.data.category_id)) {
                    pricingInfo = utill.fetchURL(pricingUrl, 'GET', headers).then(res => utill.getResolvedData(res))
                }
                return pricingInfo
            })

            /** For questions */
            chatDataResponseObj.questions = adObj.then(response => {
                let senderType = "buyer";
                let questionInfo = {}
                if (user_id == response.data.user_id) {
                    senderType = "seller"
                }
                let categoryId = response.data.category_id
                questionUrl =  questionUrl.replace('{category-id}', categoryId)
                questionUrl =  questionUrl.replace('{sender-type}', senderType)

                if (question_categories_list.includes(categoryId)) {
                    questionInfo = utill.fetchURL(questionUrl, 'GET', headers).then(res => utill.getResolvedData(res))
                }
                return questionInfo
            })

            /** For user */
            chatDataResponseObj.user = peerInfo.then(res => utill.getResolvedData(res))

            return chatDataResponseObj;
        }
    }
};

module.exports = resolvers