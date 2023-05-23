import express from 'express';
import paypal from 'paypal-rest-sdk';

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': process.env.payPalClientId,
    'client_secret': process.env.payPalClientSecret
});

const paymentRouter = express.Router();

paymentRouter.route('/pay').get((req, res) => {
    res.render('payment');
}).post((req, res) => {
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3000/success",
            "cancel_url": "http://localhost:3000/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "Red Sox Hat",
                    "sku": "001",
                    "price": "1.00",
                    "currency": "CAD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "CAD",
                "total": "1.00"
            },
            "description": "Hat for the best team ever"
        }]
    };

    paymentRouter.get('/success', (req, res) => {
        const payerId = req.query.PayerID;
        const paymentId = req.query.paymentId;

        const execute_payment_json = {
            "payer_id": payerId,
            "transactions": [{
                "amount": {
                    "currency": "CAD",
                    "total": "1.00"
                }
            }]
        };

        paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
            if (error) {
                console.log(error.response);
                throw error;
            } else {
                console.log(JSON.stringify(payment));
                res.send('Success');
            }
        });
    });

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
                    res.redirect(payment.links[i].href);
                }
            }
        }
    });
});
paymentRouter.get('/cancel', (req, res) => res.send('Cancelled'));

export default paymentRouter;