FROM alpine:latest
LABEL maintainer="Jisu Kim <vbalien@live.jp>"

RUN apk add --no-cache nodejs yarn
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn
COPY . .
CMD [ "yarn", "serve" ]
