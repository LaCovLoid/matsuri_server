import express, { json, request, urlencoded } from "express";
import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";
import crypto from "crypto";
import axios, { AxiosResponse } from "axios";
import cors from "cors";
import * as deepl from "deepl-node";

import { Festival } from "../type";

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

app.get("/update", updateHandler);
async function updateHandler(req: any, res: any) {
  if (connection == null) return;

  let result: Festival[] = [];
  let list: Festival[] = [];

  for (let i: number = 0; i < 4; i++) {
    const response: any = await axios.get(getLink(i, 1));
    if (!response || !response.data) return;

    let responseData: string = response.data;
    let maxPage: string = responseData
      .split("m-pager__current")[1]
      .split("/")[2]
      .split("（全")[0];

    if (isNaN(Number(maxPage))) {
      res.status(404).send({ reason: "SourcePage Loading Error" });
      return;
    }
    for (let j = 1; j < Number(maxPage) + 1; j++) {
      result = result.concat(await getList(getLink(i, j)));
    }
  }

  result = removeDuplicates(result);
  res.send(result);
}

///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////
///////////////////////////////////

async function getList(link: string): Promise<Festival[]> {
  const response: AxiosResponse<any> = await axios.get(link);
  if (!response || !response.data) {
    return [];
  }

  let list: string[] = response.data.split('"m-mainlist-item"');
  let result: Festival[] = [];
  for (let i = 1; i < list.length; i++) {
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

    /* db저장 간소화를 위해 생각해봤지만 용량을 조금 더 쓰는게 나을것같음
    let thumbnail = list[i].split('img src="')[1].split('"')[0];
    if (!(thumbnail.indexOf("wtd/event/") == -1)) {
      thumbnail = "//www.walkerplus.com/asset/images/common/no_image_spot.jpg";
    }
    */

    let info: Festival = {
      id: list[i].split("event/")[1].split("/")[0].trim(),
      title: list[i]
        .split('m-mainlist-item__ttl">')[1]
        .split("</span")[0]
        .trim(),
      thumbnail: list[i].split('img src="')[1].split('"')[0],
      date: list[i]
        .split("m-mainlist-item-event__period")[1]
        .split('">')[1]
        .split("</p>")[0]
        .trim(),
      tag: tagList,
    };
    result.push(info);
  }
  return result;
}

function removeDuplicates(list: Festival[]): Festival[] {
  let result: Festival[] = [];
  return Array.from(
    new Map(list.map((festival) => [festival.id, festival])).values()
  );
}

function getLink(increase: number, page: number): string {
  const now: Date = new Date(); // 현재 날짜
  let month: number = now.getMonth() + 1 + increase; // 0 = 1월
  if (month > 12) month = month % 12;

  const link =
    "https://www.walkerplus.com/event_list/" +
    (month < 10 ? "0" : "") +
    String(month) +
    "/eg0135/" +
    String(page) +
    ".html";

  return link;
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
