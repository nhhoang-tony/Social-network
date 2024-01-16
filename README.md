# <a href="https://socialnetwork.tonynguyen61.com" target="_blank" rel="noopener noreferrer">View</a>

# A social networking site where you can share your ideas, receive latest news updates, and follow your favorite people

## To run the social network locally

1. Clone the repo `git clone https://github.com/nhhoang-tony/Social-network.git` 

2. Ensure you have Python installed on your system. If not, follow this guide to install `https://www.python.org/downloads/`

3. Run `pip install -r requirements.txt` to install the project dependencies.

4. Run `echo $TZ > /etc/timezone` and `ln -snf /usr/share/zoneinfo/$TZ /etc/localtime` to set up timezone

5. Run `python manage.py runserver` to start the social network and start connecting with people.

# Afternatively, run the social network locally via Docker

1. Ensure you have Docker installed on your system. If not, follow this guide here to install `https://docs.docker.com/engine/install/`

2. Download the docker image `docker pull tonynguyen61/cs50w_network:latest`

3. Run Docker image locally `docker run -it -p 8080:8080 tonynguyen61/cs50w_network:latest`

4. If you run the social network locally via Docker, this is just a local social network only. Changes made here won't be reflected in the web version.
