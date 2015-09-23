FROM ubuntu:14.04

RUN \
  apt-get update && \
  apt-get install -y \
    vim \
    wget \
    curl \
    software-properties-common

RUN \
  curl --silent --location https://deb.nodesource.com/setup_4.x | sudo bash - && \
  apt-get install -y nodejs

RUN \
  echo "deb http://ubuntu.kurento.org trusty-dev kms6" | sudo tee /etc/apt/sources.list.d/kurento-dev.list && \
  wget -O - http://ubuntu.kurento.org/kurento.gpg.key | sudo apt-key add - && \
  sudo apt-get update && \
  sudo apt-get install -y kurento-media-server-6.0

CMD /usr/bin/kurento-media-server
