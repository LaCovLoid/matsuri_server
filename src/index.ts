import express, { json, request, urlencoded } from "express";
import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";
import crypto from "crypto";
import axios from "axios";
import cors from "cors";
import * as deepl from "deepl-node";

const app = express();
const port = 3000;
let connection: any;

dotenv.config();
connectServer();

app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

async function connectServer() {
  connection = await createConnection({
    host: process.env.DB_HOST, // 'localhost',
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  console.log("connection successful?", connection != null);
}

//arrow function으로 바꿔 작성할 것
app.get("/", homeHandler);
async function homeHandler(req: any, res: any) {
  if (connection == null) return;

  const now: Date = new Date(); // 현재 날짜
  let month: number = now.getMonth() + 1; // 0 = 1월
  let matsuriList: {}[] = []; // 축제 정보들 넣을 예정

  /*
  //페이지별로 들어가서 리스트 가져오기
  for (let i: number = 0; i < 4; i++, month++) {
    month = month % 12; //12월 초과시 1월로

    const response: any = await axios.get(
      "https://www.walkerplus.com/event_list/" +
        (month < 10 ? "0" : "") +
        String(month) +
        "/eg0135/"
    );
  }
  */
  const response: any = await axios.get(
    "https://www.walkerplus.com/event_list/" +
      (month < 10 ? "0" : "") +
      String(month) +
      "/eg0135/"
  );

  let list: string[] = response.data.split('"m-mainlist-item"');

  let tagList: string[] = [];
  for (
    let i: number = 0;
    i < list[1].split("m-mainlist-item__tagsitemlink").length - 1;
    i++
  ) {
    let tag: string = list[1]
      .split("m-mainlist-item__tagsitemlink")
      [i + 1].split("</")[0]
      .split('">')[1];
    tagList.push(tag);
  }

  let info: {} = {
    ori: list[1].trim(),
    count: list[1].indexOf("入場無料") ? true : false,
    link: list[1].split("event/")[1].split("/")[0].trim(),
    title: list[1].split('m-mainlist-item__ttl">')[1].split("</span")[0].trim(),
    date: list[1].split("終了間近</span>\n")[1].split("</p>")[0].trim(),
    tag: tagList,
  };
  res.send(info);
}

/*
app.get('/random', randomHandler);
async function randomHandler(req:any, res:any) {
  if (connection == null) return;
  
  let [result] = await connection.query("SELECT * FROM `words` WHERE `yomi_word_same`='0' Order by rand() Limit 1");
  if (result == null) {
    res.status(404).send({reason:"DB Error"});
  }
  res.send();
}
*/
/*
app.get('/translate', translateHandler);
async function translateHandler(req:any, res:any):Promise<any> {
  const authKey = String(process.env.authKey);
  const translator = new deepl.Translator(authKey);

  let text = req.query.text;
  let type = req.query.type;
  let startLanguage = '';
  let toLanguage = '';

  if (text == null) text = "안녕하세요";
  if (type == null) type = 0;

  if (type == 0) {
    startLanguage = 'ja';
    toLanguage = 'ko';
  }else {
    startLanguage = 'ko';
    toLanguage = 'ja';
  }
  translator.translateText(text, startLanguage as deepl.SourceLanguageCode, toLanguage as deepl.TargetLanguageCode)
    .then(deeplFetchHandler)
    .catch(deeplErrorHandler);

  function deeplErrorHandler() {
    res.status(404).send();
  }
  function deeplFetchHandler(response:any) {
    res.send(response.text);
  }
}
*/

function sha512Hash(str: string): string {
  return crypto.createHash("sha512").update(str).digest("hex");
}
