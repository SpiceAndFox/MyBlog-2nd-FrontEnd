#!/bin/bash
set -e

rm -rf BlogFrontEnd
git clone --depth 1 git@github.com:SpicyAndWolf/MyBlog-2nd-FrontEnd.git BlogFrontEnd

cd BlogFrontEnd
pnpm install
pnpm build

sudo rm -rf /var/www/blog-front/dist
sudo cp -r dist /var/www/blog-front/
