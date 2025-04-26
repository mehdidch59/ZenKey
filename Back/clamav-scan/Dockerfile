FROM clamav/clamav:stable

COPY scan.sh /usr/local/bin/scan.sh
RUN chmod +x /usr/local/bin/scan.sh

ENTRYPOINT ["/usr/local/bin/scan.sh"]
