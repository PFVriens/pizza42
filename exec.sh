#!/usr/bin/env bash
docker build -t pizza42_poc .
docker run -p 3000:3000 -p 3001:3001 -it pizza42_poc
