#!/bin/sh

PROJECT_FOLDER=/home/
DIR=/home/machinaide

# git clone from private github account
cd $PROJECT_FOLDER
git clone https://github.com/suatbayir1/machinaide.git

# gvm install for go (before these commands execute sudo -s / sudo su)
sudo apt-get install curl git mercurial make binutils bison gcc build-essential
#RUN ["/bin/bash", "-c", "bash < <(curl -s -S -L https://raw.githubusercontent.com/moovweb/gvm/master/binscripts/gvm-installer)"]
# bash < <(curl -s -S -L https://raw.githubusercontent.com/moovweb/gvm/master/binscripts/gvm-installer)
curl -s -S -L https://raw.githubusercontent.com/moovweb/gvm/master/binscripts/gvm-installer

source /root/.gvm/scripts/gvm

# install go by gvm
gvm install go1.15 -B
gvm use go1.15 --default
export GOROOT_BOOTSTRAP=$GOROOT
GO111MODULE=on

# install yarn for ubuntu
sudo apt remove yarn cmdtest
wget -qO- https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
sudo apt-add-repository "deb https://dl.yarnpkg.com/debian/ stable main"

# if os say apt-add-repository command not found install below package
# apt-get install software-properties-common
# apt-get update

sudo apt install make clang pkg-config protobuf-compiler libprotobuf-dev yarn

# rust install
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# mongodb install
sudo apt update
sudo apt install mongodb 
# if sudo systemctl status mongodb result is OK, mongodb successfully installed 

# apache kafka install
cd /opt/
sudo wget https://kozyatagi.mirror.guzel.net.tr/apache/kafka/2.8.0/kafka_2.13-2.8.0.tgz
sudo tar -xvzf kafka_2.13-2.8.0.tgz 

# java install
apt install default-jre


# building influxdb
cd $DIR/influxdb
make