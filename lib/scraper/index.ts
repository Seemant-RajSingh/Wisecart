"use server"

import axios from 'axios';
import * as cheerio from 'cheerio'; // import everything as cheerio from lib_name
import { extractCurrency, extractDescription, extractPrice } from '../utils';



export async function scrapeAmazonProduct(url: string) {
    if(!url) return;

    // BrightData proxy configuration
  const username = String(process.env.BRIGHT_DATA_USERNAME);
  const password = String(process.env.BRIGHT_DATA_PASSWORD);

  const port = 22225;
  const session_id = (1000000 * Math.random()) | 0;

  const options = {
    auth: {
      username: `${username}-session-${session_id}`,
      password,
    },
    host: 'brd.superproxy.io',
    port,
    rejectUnauthorized: false,
  }


  try {
    // fetch product page
    const response = await axios.get(url, options);
    const $ = cheerio.load(response.data);  // similar to html response


    const title = $('#productTitle').text().trim();

    const category = $('#nav-progressive-subnav #nav-subnav span.nav-a-content img.nav-categ-image')[0]?.attribs.alt;
    
    const currentPrice = extractPrice(
      $('.priceToPay span.a-price-whole'),
      $('.a.size.base.a-color-price'),
      $('.a-button-selected .a-color-base'),
    );  // works with just first parameter as well

    const originalPrice = extractPrice(
      // possible ids and classnames to identify the element done manually
      $('#priceblock_ourprice'),
      $('.a-price.a-text-price span.a-offscreen'),
      $('#listPrice'),
      $('#priceblock_dealprice'),
      $('.a-size-base.a-color-price')
    );

    const outOfStock = $('#availability span').text().trim().toLowerCase() === 'currently unavailable'  // returns bool 

    const images = 
      $('#imgBlkFront').attr('data-a-dynamic-image') || 
      $('#landingImage').attr('data-a-dynamic-image') ||
      '{}'  // else parsing would give error

      const imageUrls = Object.keys(JSON.parse(images));

      const currency = extractCurrency($('.a-price-symbol'))

      const discountRate = $('.savingsPercentage').text().replace(/[-%]/g, "");

      const description = extractDescription($)

      // Construct data object with scraped information
      const data = {
        url,
        currency: currency || '$',
        image: imageUrls[0],
        title,
        currentPrice: Number(currentPrice) || Number(originalPrice),
        originalPrice: Number(originalPrice) || Number(currentPrice),
        priceHistory: [],
        discountRate: Number(discountRate),
        category: category || 'category',
        reviewsCount:100,
        stars: 4.5,
        isOutOfStock: outOfStock,
        description,
        lowestPrice: Number(currentPrice) || Number(originalPrice),
        highestPrice: Number(originalPrice) || Number(currentPrice),
        averagePrice: Number(currentPrice) || Number(originalPrice),
      }

      return data;

  } catch (error: any) {
        console.log(error);
  }

}