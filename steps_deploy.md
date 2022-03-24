
./docker-prod -p --> pull the image


./docker-prod -t release2 -p        <-- in the server


0)   push image 

1)   ./script.sh -t release2 -p init-volumes $UID:$GID <-- pulling and initialize the volumes

2)   ./script.sh -t release2 -o docker-compose.yaml template docker-compose    <---- generate compose

3)   edit the compose and add the tag in the image (in the compose)

4)   ./script.sh -t release2 -o .env template env   <--- generate .env

5)

5)   docker-compose up


