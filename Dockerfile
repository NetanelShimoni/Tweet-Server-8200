FROM node:16

WORKDIR C:\Users\netan\temp

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node","server.js"]