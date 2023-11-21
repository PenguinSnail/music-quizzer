FROM node:20.2.0-alpine3.18 AS builder
WORKDIR /music-quizzer

RUN apk add --no-cache ffmpeg opus-tools make libtool autoconf automake gcc g++ python3

COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm ci

FROM node:20.2.0-alpine3.18
WORKDIR /music-quizzer

RUN apk add --no-cache ffmpeg opus-tools

COPY --from=builder /music-quizzer ./
COPY ./ ./

ENTRYPOINT ["node", "index.js"]
