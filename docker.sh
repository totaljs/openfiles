echo "BUILDING"
docker-compose build

echo "TAGGING"
docker tag opensync_web totalplatform/opensync:latest

echo "PUSHING"
docker push totalplatform/opensync:latest

echo "DONE"