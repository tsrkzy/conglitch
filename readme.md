# Conglitch

`HTML5` + `javascript` で作成した、ブラウザ上で完結するJPEG/PNG形式の画像グリッチツール。
勤務先での勉強会用に作成しました。

画像のグリッチというアイデアについては[ucnv氏の作品](https://ucnv.github.io/pnglitch/)を元ネタにしています。
また、開発の際には以下のURLを参考にいたしました。この場を借りてお礼申し上げます。

* [PNG形式のデータ構造･解析について (imaya氏)](http://imaya.blog.jp/archives/6136997.html)
* [PNG形式データ解析Webアプリ (imaya氏)](http://imaya.github.io/png.identify/)
* [PNG形式でのglitchを使用したGIFアニメ出力のJava実装 (hoshi-sano氏)](https://gist.github.com/hoshi-sano/6296296)

# How to use

try on [github pages](https://tsrkzy.github.io/conglitch/).

```
# install modules and packages
npm install

# create bundle file with webpack (watch mode)
npm run build

# start server
npm start
```

# License

MIT
