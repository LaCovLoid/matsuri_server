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

  if (!response || !response.data) {
    res.status(404).send({ reason: "not found page" });
    return;
  }

  let responseText: string = response.data;
  let list: string[] = responseText.split('"m-mainlist-item"');

  const maxPage: string = responseText
    .split("件中")[0]
    .split("m-mainlist-condition__result")[1]
    .split("全")[1];

  function getList() {
    let result: {}[] = [];
    // 페이지 하나만 반환하니까 위에서 for문으로 여러개 돌려서 리스트 쭉 내오기
    for (let i = 1; i < list.length; i++) {
      ///////0개일경우 예외처리 만들기//////
      let tagList: string[] = [];
      for (
        let j = 0;
        j < list[i].split("m-mainlist-item__tagsitemlink").length - 1;
        j++
      ) {
        let tag: string = list[i]
          .split("m-mainlist-item__tagsitemlink")
          [j + 1].split("</")[0]
          .split('">')[1];
        tagList.push(tag);
      }

      let info: {} = {
        무료: tagList.includes("入場無料") ? true : false,
        link: list[i].split("event/")[1].split("/")[0].trim(),
        title: list[i]
          .split('m-mainlist-item__ttl">')[1]
          .split("</span")[0]
          .trim(),
        date: list[i]
          .split("m-mainlist-item-event__period")[1]
          .split("20")[1]
          .split("</p>")[0]
          .trim(),
        tag: tagList,
      };
      result.push(info);
      return info;
    }
  }

  res.send({
    link: "https://www.walkerplus.com/event_list/eg0135/",
    list: result,
    src: maxPage,
  });
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
