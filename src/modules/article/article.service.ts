/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-var-requires */
import {
  HttpService,
  HttpStatus,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import got from 'got';
import * as moment from 'moment';
import { getImg } from 'src/common/dto/pagination.dto';
import { customThrowError } from 'src/common/helpers/throw.helper';
import { Article } from 'src/entities/article/article.entity';
import { Tag } from 'src/entities/tag/tag.entity';
import { In, Repository } from 'typeorm';
import { ArticleRequest } from './dto/articleRequest.dto';
const cheerio = require('cheerio');
const Nightmare = require('nightmare');
const baseUrl = 'https://hackernoon.com';

@Injectable()
export class ArticleService implements OnModuleInit {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private readonly httpService: HttpService,
  ) {}

  async onModuleInit(): Promise<boolean> {
    await this.updateDateTime();
    return true;
  }

  async search(request: ArticleRequest): Promise<any> {
    console.log({ request });
    const { skip, take, searchKeyword } = request;
    return await this.articleRepository
      .createQueryBuilder('article')
      .skip(skip)
      .take(take)
      .where('title ILIKE :searchTerm', {
        searchTerm: `%${searchKeyword}%`,
      })
      .orWhere('content ILIKE :searchTerm', {
        searchTerm: `%${searchKeyword}%`,
      })
      .select()
      .getManyAndCount();
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

  async crawl10ArticlePerTopic(): Promise<boolean> {
    const data = await this.tagRepository.find();
    const articleArray = [];
    for (let tag = 0; tag < data.length; tag++) {
      // data.map(u => {
      articleArray.push({
        url: `${data[tag].url}?page=${1}`,
        tag: data[tag],
      });
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
              // customThrowError(`Error happend, ${e}`, HttpStatus.BAD_GATEWAY);
            });
        }),
      );
    }
    await this.getDataContentWithImg();

    return true;
  }
  //schedule
  // @Cron('5 * * * * *')
  // async crawlSchedule() {
  //   //getData
  //   console.log('run 45s');
  //   const newPost = await this.articleRepository.find({
  //     where: { processed: false },
  //   });
  //   try {
  //     for (let i = 0; i < newPost.length; i++) {
  //       const result = await this.httpService
  //         .post('localhost:5050/preprocess', newPost)
  //         .toPromise();
  //       if (result) {
  //         await this.articleRepository.save({
  //           id: newPost[i].id,
  //           processed: true,
  //         });
  //       }
  //     }
  //   } catch (e) {
  //     customThrowError('chedule false, error: ', e);
  //   }

  //   return true;
  // }

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

  public async getDataContentWithImg(): Promise<boolean> {
    const articleData = await this.articleRepository.find({
      where: [{ content: '' }, { content: null }],
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
            .evaluate(() => document.querySelector('body').innerHTML)
            .end()
            .then(async response => {
              const contentData = await this._getContentWithImg(response);
              let date = contentData.date;
              if (contentData.date) {
                date = moment(
                  `${contentData.date.replace(/(^\s+|\s+$)/g, '')}`,
                  'MMMM Do YYYY',
                ).format();
              }
              await this.articleRepository.save({
                id: u.id,
                date: contentData.date,
                content: contentData.content,
                imgUrl: contentData.imgUrl,
                author: contentData.author,
                thumpImg: contentData.thumpImg,
                processedDate: date,
              });
            })
            .catch(e => {
              console.log('error happend', e);
              // customThrowError(`Error happend, ${e}`, HttpStatus.BAD_GATEWAY);
            });
        }),
      );
    }
    console.log('done');
    return true;
  }

  public async getDataContent(getRequest?: getImg): Promise<boolean> {
    const { getImg } = getRequest;
    const articleData = getImg
      ? await this.articleRepository.find({
          where: [{ thumpImg: null }, { thumpImg: '' }],
          order: {
            processedDate: 'DESC',
          },
        })
      : await this.articleRepository.find({
          where: { content: '' },
          order: {
            processedDate: 'DESC',
          },
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
            .evaluate(() => document.querySelector('body').innerHTML)
            .end()
            .then(async response => {
              const contentData = await this._getContent(
                response,
                getImg ? getImg : false,
              );

              getImg
                ? await this.articleRepository.save({
                    id: u.id,
                    thumpImg: contentData.thumpImg,
                  })
                : await this.articleRepository.save({
                    id: u.id,
                    date: contentData.date,
                    content: contentData.content,
                    imgUrl: contentData.imgUrl,
                    author: contentData.author,
                  });
            })
            .catch(e => {
              console.log('error happend', e);
              // customThrowError(`Error happend, ${e}`, HttpStatus.BAD_GATEWAY);
            });
        }),
      );
    }
    console.log('done');
    return true;
  }

  private _getContentWithImg = (html: any) => {
    const data = {
      author: '',
      content: '',
      imgUrl: '',
      date: '',
      thumpImg: '',
    };
    const $ = cheerio.load(html);
    $('.image-container.feat div img').each((i, element) => {
      if (
        $(element)
          .attr('src')
          .includes('/_next')
      ) {
        data.thumpImg = $(element).attr('src');
        return;
      }
    });
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

  private _getContent = (html: any, getImg?: boolean) => {
    const data = {
      author: '',
      content: '',
      imgUrl: '',
      date: '',
      thumpImg: '',
    };
    const $ = cheerio.load(html);
    if (getImg) {
      $('.image-container.feat div img').each((i, element) => {
        if (
          $(element)
            .attr('src')
            .includes('/_next')
        ) {
          data.thumpImg = $(element).attr('src');
          return;
        }
      });
      return data;
    }
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
    articles.map(async article => {
      await this.articleRepository.delete(article.id);
    });
    return true;
  }

  async updateDateTime(): Promise<boolean> {
    const articles = await this.articleRepository.find({
      where: [{ processedDate: null }],
    });
    articles.map(async article => {
      if (article.date) {
        const date = moment(
          `${article.date.replace(/(^\s+|\s+$)/g, '')}`,
          'MMMM Do YYYY',
        ).format();

        await this.articleRepository.update(
          { id: article.id },
          { processedDate: date },
        );
      }
    });
    return true;
  }

  async getArticlesByDate(
    request: ArticleRequest,
  ): Promise<[Article[], number]> {
    const { skip, take } = request;
    const [articles, count] = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.tag', 'tag')
      .skip(skip)
      .take(take)
      .orderBy('article.processedDate', 'DESC')
      .select()
      .getManyAndCount();

    return [articles, count];
  }

  async getArticlesByDateAndTag(
    request: ArticleRequest,
    tagId: number,
  ): Promise<[Article[], number]> {
    const { skip, take } = request;
    const [articles, count] = await this.articleRepository
      .createQueryBuilder('article')
      .where('article.tagId = :tagId ', { tagId: tagId })
      .leftJoinAndSelect('article.tag', 'tag')
      .skip(skip)
      .take(take)
      .orderBy('article.processedDate', 'DESC')
      .select()
      .getManyAndCount();

    return [articles, count];
  }

  async getTags(request: ArticleRequest): Promise<[Tag[], number]> {
    const { skip, take } = request;
    const [tags, count] = await this.tagRepository
      .createQueryBuilder('tag')
      .skip(skip)
      .take(take)
      .orderBy('tag.title', 'ASC')
      .select()
      .getManyAndCount();

    return [tags, count];
  }

  async getTagData(tagId: number): Promise<Tag> {
    return await this.tagRepository.findOne(tagId);
  }

  async getSavedArticlesByDate(
    request: ArticleRequest,
    articleIds: number | number[] | string | string[],
  ): Promise<[Article[], number]> {
    const { skip, take } = request;
    const articleIdsArr = !Array.isArray(articleIds)
      ? [articleIds]
      : articleIds;
    const [articles, count] = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.tag', 'tag')
      .skip(skip)
      .take(take)
      .where({ id: In(articleIdsArr) })
      .select()
      .getManyAndCount();

    return [articles, count];
  }

  async getThumpImg(): Promise<boolean> {
    const articles = await this.articleRepository.find({
      where: [{ thumpImg: null }],
    });
    // articles.map(async article => {
    //   await this.articleRepository.delete(article.id);
    // });
    return true;
  }
}
