FROM node:21

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN touch blogposts.db

EXPOSE 8080

CMD ["node", "app.js"]
