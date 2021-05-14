/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-var-requires */
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import got from 'got';
import { customThrowError } from 'src/common/helpers/throw.helper';
import { Article } from 'src/entities/article/article.entity';
import { Tag } from 'src/entities/tag/tag.entity';
import { Repository } from 'typeorm';
import { ArticleRequest } from './dto/articleRequest.dto';
const cheerio = require('cheerio');
const Nightmare = require('nightmare');
const baseUrl = 'https://hackernoon.com';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}
  async search(request: ArticleRequest): Promise<any> {
    console.log({ request });
    return request;
  }

  async dataCrawling(): Promise<boolean> {
    const { body } = await got('https://hackernoon.com/tagged');
    const $ = cheerio.load(body);

    const a: any[] = [];
    $('li a')
      .get()
      .map(u => {
        try {
          const aTag = $(u);
          const linkUrl = aTag.attr('href');
          const linkText = aTag.text();
          if (linkUrl.includes('/tagged/')) {
            a.push({
              url: linkUrl,
              title: linkText,
            });
          }
        } catch (e) {
          customThrowError(`error: ${e} happened`, HttpStatus.BAD_REQUEST);
        }
      });
    a.map(async b => {
      const available = await this.tagRepository.findOne({
        title: b.title,
      });
      if (available) {
        return;
      }
      const { body } = await got(`${baseUrl}${b.url}`);
      const $ = cheerio.load(body);
      const beta = $('.tagged-header small')
        .html()
        .replace(/\D/g, '');
      const data = new Tag();
      data.title = b.title;
      data.url = `${baseUrl}${b.url}`;
      data.total = +beta;
      data.totalPage = Math.floor((+beta - 12) / 11);
      await this.tagRepository.save(data);
    });
    return true;
  }

  async crawlTopic(): Promise<boolean> {
    const data = await this.tagRepository.find();
    const articleArray = [];
    for (let tag = 0; tag < data.length; tag++) {
      // data.map(u => {
      for (let page = 1; page <= data[tag].totalPage; page++) {
        articleArray.push({
          url: `${data[tag].url}?page=${page}`,
          tag: data[tag],
        });
      }
    }

    const chunk = 6;

    const j = articleArray.length;
    for (let count = 0; count < j; count += chunk) {
      const tempData = articleArray.slice(count, count + chunk);
      await Promise.all(
        tempData.map(async u => {
          console.log(`crawl :${u.url}`);
          const nightMare = new Nightmare({
            show: false,
          });
          await nightMare
            .goto(`${u.url}`)
            .wait(2000)
            .evaluate(() => document.querySelector('body').innerHTML)
            .end()
            .then(async response => {
              const result = await this.getData(response);
              for (let j = 0; j < result.length; j++) {
                const article = await this.articleRepository.findOne({
                  title: result[j].title,
                });
                if (article) {
                  continue;
                }
                await this.articleRepository.save({
                  title: result[j].title,
                  link: `${baseUrl}${result[j].link}`,
                  tag: u.tag,
                });
              }
            })
            .catch(e => {
              customThrowError(`Error happend, ${e}`, HttpStatus.BAD_GATEWAY);
            });
        }),
      );
    }

    return true;
  }

  public getData = (html: any) => {
    const data = [];
    const $ = cheerio.load(html);
    $('h2 a', '.title-wrapper').each((i, element) => {
      data.push({
        title: $(element).text(),
        link: $(element).attr('href'),
      });
    });
    return data;
  };

  public async getDataContent(): Promise<boolean> {
    const articleData = await this.articleRepository.find({
      where: { content: null },
    });
    const chunk = 7;

    const j = articleData.length;
    for (let count = 0; count < j; count += chunk) {
      const tempData = articleData.slice(count, count + chunk);
      await Promise.all(
        tempData.map(async u => {
          const nightMare = new Nightmare({ show: false });
          console.log(`running ${u.title}`);
          await nightMare
            .goto(`${u.link}`)
            .wait(3000)
            .wait('img')
            .evaluate(() => document.querySelector('body').innerHTML)
            .end()
            .then(async response => {
              const contentData = await this._getContent(response);
              await this.articleRepository.save({
                id: u.id,
                date: contentData.date,
                content: contentData.content,
                imgUrl: contentData.imgUrl,
                author: contentData.author,
              });
            })
            .catch(e => {
              customThrowError(`Error happend, ${e}`, HttpStatus.BAD_GATEWAY);
            });
        }),
      );
    }
    console.log('done');
    return true;
  }

  private _getContent = (html: any) => {
    const data = { author: '', content: '', imgUrl: '', date: '' };
    const $ = cheerio.load(html);
    $('.profileImage div img').each((i, element) => {
      if (
        $(element)
          .attr('src')
          .includes('/_next')
      ) {
        data.imgUrl = $(element).attr('src');
        return;
      }
    });
    $('div .profile div h3 small').each((i, element) => {
      if ($(element).text()) {
        data.author = $(element).text();
        return;
      }
    });
    $('.paragraph').each((i, element) => {
      data.content = data.content.concat(' ', $(element).text());
    });

    $('.date').each((i, element) => {
      if ($(element).text()) {
        data.date = $(element).text();
        return;
      }
    });
    return data;
  };

  async cleanArticles(): Promise<boolean> {
    const articles = await this.articleRepository.find({
      where: [{ content: '' }, { content: null }],
    });
    await this.articleRepository.remove(articles);
    return true;
  }
}
