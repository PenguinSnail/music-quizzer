FROM node:20.2.0-alpine3.18

WORKDIR /music-quizzer

RUN apk add --no-cache ffmpeg opus-tools make libtool autoconf automake gcc g++ python3

COPY ./package.json /music-quizzer
COPY ./package-lock.json /music-quizzer
RUN npm ci

COPY . /music-quizzer/

ENTRYPOINT ["node", "index.js"]
