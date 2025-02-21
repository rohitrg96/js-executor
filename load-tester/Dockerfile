FROM node:18-alpine
RUN apk update && apk add apache2-utils
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "load-tester-api.js"]

