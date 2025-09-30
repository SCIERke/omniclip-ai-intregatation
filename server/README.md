For using it (run all this command in server-root directory)
1. install all necessary in python package by running this command
```bash
pip or pip3 install -r config/requirements.txt
```
2. get hf token and note it
2. after that setting your modal host by go to modal and login create your secrete and use with init bash
```bash
./set_modal_tokens.sh <modal_token_id> <modal_token_secret> <hf_token>
```
after that you need to see .env
now you ready to go!
4. run the server by using this command
```
python3 -m fastapi dev server.py
```
# endpoint
/ (get) = this is health-check for our server, you can open it from browser all using it via api tools
/inference/modal (post) = inference by providing
model_key = you can see avaiable model in MODELS or you can add your model by config in MODELS file by your own
prompt (optional)
image (optional)