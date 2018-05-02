#!/bin/bash

TARGET_PATH=/var/www/html

sudo cp -r public /var/www/html
sudo cp -r server /var/www/html
sudo cp -r scripts /var/www/html
sudo cp config.yaml /var/www/html
sudo cp LICENSE.txt /var/www/html
sudo cp package.json /var/www/html
sudo cp package-lock.json /var/www/html
LAST_LOC=`echo \`pwd\``
cd $TARGET_PATH
sudo npm install
cd $LAST_LOC
