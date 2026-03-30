const http = require('http');

function testPDF() {
  const loginData = JSON.stringify({
    email: 'gonzaleserishkarl@gmail.com',
    password: 'Erish@2024'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };

  const loginReq = http.request(loginOptions, (loginRes) => {
    let data = '';
    loginRes.on('data', chunk => data += chunk);
    loginRes.on('end', () => {
      try {
        console.log('Login response status:', loginRes.statusCode);
        console.log('Login response body:', data);
        const loginBody = JSON.parse(data);
        const token = loginBody.data?.token || loginBody.token;
        console.log('Extracted token:', token);

        // Now fetch PDF
        const pdfOptions = {
          hostname: 'localhost',
          port: 3000,
          path: '/api/reports/pdf?period=daily',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };

        const pdfReq = http.request(pdfOptions, (pdfRes) => {
          console.log('PDF Status:', pdfRes.statusCode);
          console.log('PDF Headers:', pdfRes.headers);
          if (pdfRes.statusCode === 200) {
            console.log('PDF generated successfully!');
          } else {
            let pdfData = '';
            pdfRes.on('data', chunk => pdfData += chunk);
            pdfRes.on('end', () => {
              console.log('Error:', pdfData);
            });
          }
        });

        pdfReq.on('error', console.error);
        pdfReq.end();
      } catch (err) {
        console.error('Login error:', err);
        console.error('Response:', data);
      }
    });
  });

  loginReq.on('error', console.error);
  loginReq.write(loginData);
  loginReq.end();
}

testPDF();
