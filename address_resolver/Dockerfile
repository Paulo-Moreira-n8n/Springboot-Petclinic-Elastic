FROM python:3.6-stretch

ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1
ENV HOME /root
ENV DEBIAN_FRONTEND noninteractive
WORKDIR /usr/src/
RUN git clone https://github.com/elastic/spring-petclinic.git
WORKDIR /usr/src/spring-petclinic/address_resolver/src
RUN pip install gunicorn json-logging-py
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5000
WORKDIR /opt/bot_server

ENTRYPOINT ["/usr/local/bin/gunicorn", "--config", "gunicorn.conf", "--log-config", "logging.conf", "-b", ":5000", "server:app"]



# docker run -it --rm --network petclinic-stack_spring-petclinic-net -v "$(pwd):/app" -w /app node bash
# cp zscalerrootca.crt /usr/local/share/ca-certificates/ && update-ca-certificates
# npx playwright install --with-deps
node -e "
  const { chromium } = require('playwright');
  (async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://spring-petclinic-client:3000/owners/3/edit', { waitUntil: 'networkidle' });
    const html = await page.content();
    console.log(html);
    await browser.close();
  })();
"