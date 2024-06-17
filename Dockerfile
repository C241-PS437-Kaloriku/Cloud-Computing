FROM node:22

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

ENV JWT_SECRET="Your JWT Secret Key"

COPY . .

ENV PORT 8080

CMD [ "node", "app.js"]
