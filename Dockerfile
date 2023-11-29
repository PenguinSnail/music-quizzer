FROM node:21-bookworm AS builder
WORKDIR /music-quizzer

RUN apt update
RUN apt install -y ffmpeg opus-tools make libtool autoconf automake gcc g++ python3

COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm ci

FROM node:21-bookworm
WORKDIR /music-quizzer

RUN apt update
RUN apt install -y ffmpeg opus-tools

COPY --from=builder /music-quizzer ./

COPY ./ ./

ENTRYPOINT ["node", "index.js"]
