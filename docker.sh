echo "BUILDING"
docker-compose build

echo "TAGGING"
docker tag openfiles_web totalplatform/openfiles:latest

echo "PUSHING"
docker push totalplatform/openfiles:latest

echo "DONE"