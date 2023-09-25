FROM node:20.5.0-alpine3.18
RUN addgroup app && adduser -S -G app app
WORKDIR /app
COPY package*.json ./

ENV NODE_ENV=development
ENV PORT=5000
ENV project_jwtprivatekey=mysecurekey
ENV pgPassword=123456
ENV testdb=testdb
RUN apk update && apk add --no-cache bash

RUN chown -R app:app /app 
USER app
RUN npm install
COPY . .  
ENTRYPOINT [" npm", "start"]