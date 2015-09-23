FROM ubuntu:14.04

RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections

RUN \
  apt-get update && \
  apt-get install -y \
    curl \
    vim \
    build-essential \
    python \
    git

RUN \
  curl -sL https://deb.nodesource.com/setup_4.x | bash - && \
  apt-get install -y nodejs

COPY package.json /app/package.json
RUN cd /app && npm install

COPY . /app/node

WORKDIR /app/node
CMD node index
