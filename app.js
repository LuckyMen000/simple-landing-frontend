const express = require('express'); 
const bodyParser = require('body-parser'); 
const axios = require('axios'); 
const path = require('path'); 
const app = express(); 
const port = 3000; 
 
app.set('view engine', 'ejs'); 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json()); 
app.use(express.static(path.join(__dirname, 'public'))); 
 
const hiddenFieldValue = 'test'; 
 
app.get('/', (req, res) => { 
  res.render('index', { hiddenFieldValue }); 
}); 
 
app.post('/submit', async (req, res) => { 
  const { name, phone, hiddenField } = req.body; 
  const phoneRegex = /^\+\d{1,3}\(\d{3}\)\d{3}-\d{2}-\d{2}$/; 
 
  if (!phoneRegex.test(phone)) { 
    return res.send('Некорректный номер телефона'); 
  } 
 
  if (hiddenField !== hiddenFieldValue) { 
    return res.send('Дублирующая заявка'); 
  } 
 
  try { 
    const response = await axios.post( 
      'https://order.drcash.sh/v1/order', 
      { stream_code: 'iu244', client: { name, phone }, sub1: hiddenField }, 
      { 
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': 'Bearer NWJLZGEWOWETNTGZMS00MZK4LWFIZJUTNJVMOTG0NJQXOTI3' 
        } 
      } 
    ); 
 
    if (response.data.uuid) { 
      res.redirect('/thank-you'); 
    } else { 
      console.error('Ошибка при отправке заказа. Полный ответ от сервера:', response.data); 
      res.send('Ошибка при отправке заказа'); 
    } 
  } catch (error) { 
    console.error('Ошибка при отправке запроса:', error); 
     
    if (error.code === 'ECONNRESET') { 
      setTimeout(async () => { 
        try { 
          const retryResponse = await axios.post( 
            'https://65db67263ea883a15291a74a.mockapi.io/api/cash/user', 
            { stream_code: 'iu244', client: { name, phone }, sub1: hiddenField }, 
            { 
              headers: { 
                'Content-Type': 'application/json', 
                'Authorization': 'Bearer NWJLZGEWOWETNTGZMS00MZK4LWFIZJUTNJVMOTG0NJQXOTI3' 
              } 
            } 
          ); 
 
          if (retryResponse.data.id) { 
            res.redirect('/thank-you'); 
          } else { 
            console.error('Ошибка при повторной отправке заказа. Полный ответ от сервера:', retryResponse.data); 
            res.send('Ошибка при повторной отправке заказа'); 
          } 
        } catch (retryError) { 
          console.error('Ошибка при повторной отправке запроса:', retryError); 
          res.send('Ошибка при повторной отправке запроса'); 
        } 
      }, 5000); 
    } else { 
      res.send('Ошибка при отправке запроса'); 
    } 
  } 
}); 
 
app.get('/thank-you', (req, res) => { 
    res.render('thank-you'); 
  }); 
 
 
app.listen(port, () => { 
  console.log(`Server is running at http://localhost:${port}`); 
});
