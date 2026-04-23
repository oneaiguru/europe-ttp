git push -u origin master


# upgrade pip
pip install -U pip



pip install -t lib google-cloud-storage
pip install -t lib requests --upgrade


# run below command in the folder you want to download the library
npm install --save material-components-web

gsutil -m cp -R gs://artofliving-ttcdesk.appspot.com backup

# 2. Setup CORS (Cross Origin Resource Sharing)
# https://www.the-swamp.info/blog/uploading-files-google-cloud-storage/
gsutil cors set gcs_cors.json gs://artofliving-ttcdesk.appspot.com

pip install -t lib -r requirements.txt
pip install -t lib -r requirements.txt --upgrade

find . -name 'Icon?' -type f -delete
find . -name '*.pyc' -type f -delete

gcloud app deploy app.yaml --project artofliving-ttcdesk-dev --version 3

gcloud app deploy app.yaml --project artofliving-ttcdesk-dev --version 3 --no-cache

gcloud app deploy app.yaml --project artofliving-ttcdesk-dev --version "in" --no-cache --no-promote

gcloud app deploy cron.yaml --project artofliving-ttcdesk-dev

