ZIP_NAME="Tab Flow.zip"
PKG_DIR="Package/"

pkg:
	cp manifest.json $(PKG_DIR)
	cp -r images $(PKG_DIR)
	cp *.html $(PKG_DIR)
	cp *.css $(PKG_DIR)
	cp *.js $(PKG_DIR)
	zip -r $(ZIP_NAME) $(PKG_DIR)
