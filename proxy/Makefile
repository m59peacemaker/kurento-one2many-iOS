cp_ssl = mkdir -p /etc/nginx/ssl && cp -R ./ssl/* /etc/nginx/ssl/
cp_conf = cp ./nginx.conf /etc/nginx/
nginx = service nginx start 2> /dev/null || service nginx reload

start:
	${cp_ssl} && ${cp_conf} && ${nginx}
