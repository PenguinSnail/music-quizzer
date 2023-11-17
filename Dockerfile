FROM node:21-alpine

WORKDIR /music-quizzer

RUN apk add --no-cache ffmpeg opus-tools make

COPY ./package.json /music-quizzer
COPY ./package-lock.json /music-quizzer
RUN npm ci

COPY . /music-quizzer/

ENTRYPOINT ["node", "index.js"]
