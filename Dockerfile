FROM node:15.12.0-alpine

WORKDIR /music-quizzer

RUN apk add --no-cache ffmpeg opus-tools

COPY ./package.json /music-quizzer
COPY ./package-lock.json /music-quizzer
RUN npm ci

COPY ./*.js /music-quizzer

ENTRYPOINT ["node", "index.js"]