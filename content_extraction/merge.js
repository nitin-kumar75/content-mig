require('dotenv').config();

const { Curl  } = require('node-libcurl');

const XLSX = require('xlsx');

const axios = require('axios');

const moment = require('moment');

var express = require('express');

var router = express.Router();

const path = require('path');

const archiver = require('archiver');

const fs = require('fs');

// app.js
const yargs = require('yargs/yargs');

const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv)).argv;


var _ = require('lodash');
const { error } = require('console');

const APIURL = process.env.SITECORE_APIURL;


const getPath = (lang) => {

  const obj = {
    en: {
      DOMAIN: `${process.env.SITECORE_CONTENT_EN_DOMAIN}`,
      TRAVEL_INFORMATION: `/travel-information`,
      IN_AND_AROUND: `/in-and-around-the-house`,
      SERVICE_CONTACT: `/service-contact`,
      PARK_RULES: `/park-rules`,
      ORDER_INFO: `/facilities/food-drinks/order-fresh-bread-rolls`,
      FACILITIES: `/facilities`
    },
    nl: {
      DOMAIN: `${process.env.SITECORE_CONTENT_NL_DOMAIN}`,
      TRAVEL_INFORMATION: `/reisinformatie`,
      IN_AND_AROUND: `/in-en-rondom-huis`,
      SERVICE_CONTACT: `/service-contact`,
      PARK_RULES: `/parkregels`,
      ORDER_INFO: `/faciliteiten/eten-drinken/broodjes-bestellen`,
      FACILITIES: `/faciliteiten`
    },
    de: {
      DOMAIN: `${process.env.SITECORE_CONTENT_DE_DOMAIN}`,
      TRAVEL_INFORMATION: `/reiseinformationen`,
      IN_AND_AROUND: `/im-und-um-das-haus-herum`,
      SERVICE_CONTACT: `/service-kontakt`,
      PARK_RULES: `/parkregels`,
      ORDER_INFO: `/einrichtungen/essen-trinken/brotchen-bestellen/`,
      FACILITIES: `/einrichtungen`
    },
    fr: {
      DOMAIN: `${process.env.SITECORE_CONTENT_FR_DOMAIN}`,
      TRAVEL_INFORMATION: `/informations-de-voyage`,
      IN_AND_AROUND: `/dans-et-autour-de-la-maison`,
      SERVICE_CONTACT: `/service-contact`,
      PARK_RULES: `/reglement-du-parc`,
      ORDER_INFO: `/equipements/restauration-boissons/commander-des-petits-pains/`,
      FACILITIES: `/equipements`
    }
  }
  return obj[lang];
}

const handleError = (error) => {
  if(process.env.IS_DEBUG === "true") {
    console.log(JSON.stringify(error))
  }
}

async function authenticate() {

  const url = `${APIURL}/auth`;

  const data = new URLSearchParams({
    username: process.env.SITECORE_API_USERNAME,
    password: process.env.SITECORE_API_PASSWORD,
  });

  try {
    const response = await axios.post(url, data.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      maxRedirects: 10,
      timeout: 30000,
    });
    return response.data.access_token
  } catch (error) {
    if (error.response) {
      handleError(error)
    } else {
      handleError(error)
    }
  }
}


const fetchDataAndWriteFiles = async (items, folder) => {
  try {
    items.map((item, index) => {
      const filePath = path.join(folder, item.file);
      fs.writeFileSync(filePath, JSON.stringify(item.data, null, 2));
    })
  } catch (error) {
      console.error(`Error fetching data: ${error.message}`);
  }
};



async function getParkDetails(lang, token, parkId) {

  let url = `${APIURL}/parks/${parkId}?language=${lang}&auth_token=${token}`;

  if(lang === '') {
    url = `${APIURL}/parks/${parkId}?auth_token=${token}`;
  }

  try {
    const response = await axios.get(url, {
      maxRedirects: 10,
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    handleError(error)
  }
}

async function getParks(lang, token, page) {

  let url = `${APIURL}/parks?language=${lang}&auth_token=${token}&type=index&page=${page}`;

  if(lang === '') {
    url = `${APIURL}/parks?auth_token=${token}&type=index&page=${page}`;
  }

  try {
    const response = await axios.get(url, {
      maxRedirects: 10,
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    handleError(error)
  }
}

async function getExtractContent(lang, token, objectId, path, page = 1) {

  let url;

  if(path === 'parks') {
    url = `${APIURL}/${path}/${objectId}?language=${lang}&auth_token=${token}`;
    if(lang === '') {
      url = `${APIURL}/${path}/${objectId}?auth_token=${token}`;
    }
  }

  if(path === 'images') {
    url = `${APIURL}/${path}?language=${lang}&auth_token=${token}&objectId=${objectId}&page=1`;
    if(lang === '') {
      url = `${APIURL}/${path}?auth_token=${token}&objectId=${objectId}&page=1`;
    }
  }

  if(path === 'accommodations') {
    url = `${APIURL}/${path}?language=${lang}&auth_token=${token}&parentobjectId=${objectId}`;
    if(lang === '') {
      url = `${APIURL}/${path}?auth_token=${token}&parentobjectId=${objectId}`;
    }
  }

  if(path === 'accommodation') {
    url = `${APIURL}/accommodations/${objectId}?language=${lang}&auth_token=${token}`;
    if(lang === '') {
      url = `${APIURL}/accommodations/${objectId}?auth_token=${token}`;
    }
   
  }


  try {
    const response = await axios.get(url, {
      maxRedirects: 10,
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    handleError(error)
  }
}


const fetchEpiServerContent = async (contentUrl, lang) => {

  const config = getPath(lang);

  const domain = config.DOMAIN;

  const url = `${domain}${process.env.SITECORE_EPISERVERURL}?ContentUrl=${contentUrl}&expand=*`

  let updateLang = ''
  if(lang === 'en') {
    updateLang = 'en-US,en;q=0.9';
  }

  // Set up the headers
  const headers = {
    'Accept': '*/*',
    'Accept-Language': updateLang || 'en-US,en;q=0.9', 
    'Authorization': 'YWxhZGRpbjpvcGVuc2VzYW1l',
    'Cookie': 'RM-11802=a04cd9fe-e9fa-4eff-a724-7d8e57370e42; sl=F; _gcl_au=1.1.605039261.1721915872; _cs_c=0; _pin_unauth=dWlkPVlqWXdOVE14TUdJdE9UQTBZUzAwTW1SakxUaG1PR010TTJVMU9HSTRZak5tWlRNNA; FPID=FPID2.2.ujYHBZ3SGRuV%2B785QCqZECtkRyQU6NyHb13Ogry%2Fkko%3D.1721915872; FPAU=1.1.605039261.1721915872; _gtmeec=e30%3D; _fbp=fb.1.1721915876986.2050681618; travelparty=%7B%22nrAdults%22%3A2%2C%22nrPets%22%3A0%2C%22kidAges%22%3A%5B%5D%2C%22isDefault%22%3Atrue%7D; EPiStateMarker=true; .AspNetCore.Antiforgery.cdV5uW_Ejgc=CfDJ8Nq9LYcIpDRGrj8kSZj6BGS-ygctmPzLu9nvXZILYqMxMB4WolHEGsb9Tc2ON_aQdld1EEff0yfHkxhTAzkSb7-m8mlx4VAI0EN9K-yeAfaMJf05EPxKPieEd7eqrVtP2eVK_Cn_rSkuDb3fnyrIK1E; apt.uid=AP-9R2ZHMD84Z2N-2-4-1726494576727-25471976.0.2.987e442c-d771-46f6-a013-f8a737133564; ai_user=JFyJ713FIAoD0OfMbdeEUI|2024-09-16T13:49:38.214Z; RecentParks=552257; CookieConsent={stamp:%27s5KAOrcQY68MGw6pGj6fiRQlsbXzuIyxU+X971dOFJT91D+16pKRLw==%27%2Cnecessary:true%2Cpreferences:true%2Cstatistics:true%2Cmarketing:true%2Cmethod:%27explicit%27%2Cver:1%2Cutc:1726494817864%2Cregion:%27in%27}; _pin_unauth=dWlkPVlqWXdOVE14TUdJdE9UQTBZUzAwTW1SakxUaG1PR010TTJVMU9HSTRZak5tWlRNNA; cookies-user=49.36.136.30; _gid=GA1.2.1610827478.1726763743; FPLC=%2Fhm8NtHN%2FarJLhWJGC993EDNc7oRFKOQ%2BT6psuCTAZLE1IV6kap3W2lsKkVrH1%2FSg3wavmLaWY0R5H2iStzdtXkkqEgI%2Fw3zR2iguoKJBqupf7abZmQM%2F2ypSVeDlQ%3D%3D; _conv_v=vi%3A1*sc%3A6*cs%3A1726772915*fs%3A1721915871*pv%3A21*ps%3A1726766720; pagecount=6; _ga_9TW6VCDFW4=GS1.1.1726772916.6.1.1726774085.0.0.0; _cs_id=947b965b-cd03-afe4-b07e-fb80424943ed.1721915875.10.1726790769.1726790769.1.1756079875787.1; ASP.NET_SessionId=; ParkId=552257; .AspNetCore.Identity.Application=CfDJ8Nq9LYcIpDRGrj8kSZj6BGTFlq2_9ltQcsejdefKEons2ochmd7byFRILLKs4Lkb4dROAhgf0hcrcKF_9MT_Xj2Otkh25UrJmOcogsCI-Xrvpr2scE3jfZdcmq0cQxIfljg3wUsIjkgdqk9Irh14MqwgkqEh1j6IIorjrFSvjlRKazFl5P3orfrioQseniyRjLKNr5qyH7BlZQfL8q8VthnFqxHz4efkTsC4VxfEEtTla75gOEvREzcZ_7RE5NPFPxrm0ooznwW5x19yMVE2uUWs3W1BQFzcId6mHfC3VJx4ndVLDDWlTyF0cQwkYsKTmT3b4g1JNKNE11UkDjFBYDyJUsJcPMTjsyFVlQfBeHtOSxw6oNR-Jd2iZxOTbbGwr94aLeG9PUeGyTw5fLZ84AyHrkC_DKHulJo_TyE_4CDv21wyHuoSFc47IBHHT2SCyGYc2QGPJget-rmMdVzjqQ4JwrYYFbutO-mYNtw9ZBmvl68IgXo6FgYUkF1ta73FK-1t8tpc-Rq4tKD8EM_pq51R0LPc7mpRrwis-Rl7MXgsp7VcnatvoGfTGBq5ijAW9-28hXXGZPH9JW01ozbX6DfnA2LPDjdUgmMq4Eb2uU_h5KDBl1VX4X6-SeYzRsElBo_VcFp7spnpqm1F3Rvkf27F8-bkNj7sqzfvOXNK-tma-Hl_3ekeUm3-lUtabGa-J4E9dvcle619SDrId5bC7k0MceOgfUpb_slNLgblY9p86M5AQt54snAGGKkZaXvzuVP2FNVVoyn98xnkuD-L0oRPldSdFcf_jZ_tbrq0vszT8N95cX1OG4Eu4Ny2A-vvuBQQaonOwFHSdRItrkLiuv0; _cs_mk_ga=0.28756841402236155_1726824831698; apt.sid=AP-9R2ZHMD84Z2N-2-4-1726825487813-21248864; ai_session=KdpXB1FSCzwnZxdHJaXtb1|1726824831827|1726825707185; _dc_gtm_UA-2681518-43=1; _dc_gtm_UA-12345678-1=1; _ga=GA1.1.835383240.1721915872; _ga_31HEW6ZFRB=GS1.1.1726824833.11.1.1726825707.60.0.33503968; _ga_86SWJ0ZT3B=GS1.1.1726824832.11.1.1726825707.60.0.0; _ga_1234=GS1.1.1726824834.11.1.1726825707.0.0.0; _uetsid=38afeef076a511ef996d7d8f71d618ae; _uetvid=e4a227604a8d11efa738398724a2366c', // Truncated for brevity
    'Priority': 'u=1, i',
    'Sec-CH-UA': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
    'Sec-CH-UA-Mobile': '?0',
    'Sec-CH-UA-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'no-cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  };

  try {
    const response = await axios.get(url, {
      headers,
      maxRedirects: 10,
      timeout: 30000,
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }), // Disable SSL verification
    });

    return { statusCode: response.status, data: response.data, headers: response.headers };

  }
   catch (error) {
    throw error;
  }

 
  
};

const fetchEpiServerChilderens = async (contentId, lang) => {

  const url = `https://demo-parksites.roompot.nl/api/episerver/v3.0/content/${contentId}/children?expand=*`;

  // Set up the headers
  const headers = {
    'Accept': '*/*',
    'Accept-Language': lang || 'en', // Use the provided language or default to 'en'
    'Cookie': 'RM-11802=a04cd9fe-e9fa-4eff-a724-7d8e57370e42; sl=F; _gcl_au=1.1.605039261.1721915872; _cs_c=0; _pin_unauth=dWlkPVlqWXdOVE14TUdJdE9UQTBZUzAwTW1SakxUaG1PR010TTJVMU9HSTRZak5tWlRNNA; FPID=FPID2.2.ujYHBZ3SGRuV%2B785QCqZECtkRyQU6NyHb13Ogry%2Fkko%3D.1721915872; FPAU=1.1.605039261.1721915872; _gtmeec=e30%3D; _fbp=fb.1.1721915876986.2050681618; travelparty=%7B%22nrAdults%22%3A2%2C%22nrPets%22%3A0%2C%22kidAges%22%3A%5B%5D%2C%22isDefault%22%3Atrue%7D; EPiStateMarker=true; .AspNetCore.Antiforgery.cdV5uW_Ejgc=CfDJ8Nq9LYcIpDRGrj8kSZj6BGS-ygctmPzLu9nvXZILYqMxMB4WolHEGsb9Tc2ON_aQdld1EEff0yfHkxhTAzkSb7-m8mlx4VAI0EN9K-yeAfaMJf05EPxKPieEd7eqrVtP2eVK_Cn_rSkuDb3fnyrIK1E; apt.uid=AP-9R2ZHMD84Z2N-2-4-1726494576727-25471976.0.2.987e442c-d771-46f6-a013-f8a737133564; ai_user=JFyJ713FIAoD0OfMbdeEUI|2024-09-16T13:49:38.214Z; RecentParks=552257; CookieConsent={stamp:%27s5KAOrcQY68MGw6pGj6fiRQlsbXzuIyxU+X971dOFJT91D+16pKRLw==%27%2Cnecessary:true%2Cpreferences:true%2Cstatistics:true%2Cmarketing:true%2Cmethod:%27explicit%27%2Cver:1%2Cutc:1726494817864%2Cregion:%27in%27}; _pin_unauth=dWlkPVlqWXdOVE14TUdJdE9UQTBZUzAwTW1SakxUaG1PR010TTJVMU9HSTRZak5tWlRNNA; cookies-user=49.36.136.30; _gid=GA1.2.1610827478.1726763743; FPLC=%2Fhm8NtHN%2FarJLhWJGC993EDNc7oRFKOQ%2BT6psuCTAZLE1IV6kap3W2lsKkVrH1%2FSg3wavmLaWY0R5H2iStzdtXkkqEgI%2Fw3zR2iguoKJBqupf7abZmQM%2F2ypSVeDlQ%3D%3D; _conv_v=vi%3A1*sc%3A6*cs%3A1726772915*fs%3A1721915871*pv%3A21*ps%3A1726766720; pagecount=6; _ga_9TW6VCDFW4=GS1.1.1726772916.6.1.1726774085.0.0.0; _cs_id=947b965b-cd03-afe4-b07e-fb80424943ed.1721915875.10.1726790769.1726790769.1.1756079875787.1; ASP.NET_SessionId=; ParkId=552257; .AspNetCore.Identity.Application=CfDJ8Nq9LYcIpDRGrj8kSZj6BGTFlq2_9ltQcsejdefKEons2ochmd7byFRILLKs4Lkb4dROAhgf0hcrcKF_9MT_Xj2Otkh25UrJmOcogsCI-Xrvpr2scE3jfZdcmq0cQxIfljg3wUsIjkgdqk9Irh14MqwgkqEh1j6IIorjrFSvjlRKazFl5P3orfrioQseniyRjLKNr5qyH7BlZQfL8q8VthnFqxHz4efkTsC4VxfEEtTla75gOEvREzcZ_7RE5NPFPxrm0ooznwW5x19yMVE2uUWs3W1BQFzcId6mHfC3VJx4ndVLDDWlTyF0cQwkYsKTmT3b4g1JNKNE11UkDjFBYDyJUsJcPMTjsyFVlQfBeHtOSxw6oNR-Jd2iZxOTbbGwr94aLeG9PUeGyTw5fLZ84AyHrkC_DKHulJo_TyE_4CDv21wyHuoSFc47IBHHT2SCyGYc2QGPJget-rmMdVzjqQ4JwrYYFbutO-mYNtw9ZBmvl68IgXo6FgYUkF1ta73FK-1t8tpc-Rq4tKD8EM_pq51R0LPc7mpRrwis-Rl7MXgsp7VcnatvoGfTGBq5ijAW9-28hXXGZPH9JW01ozbX6DfnA2LPDjdUgmMq4Eb2uU_h5KDBl1VX4X6-SeYzRsElBo_VcFp7spnpqm1F3Rvkf27F8-bkNj7sqzfvOXNK-tma-Hl_3ekeUm3-lUtabGa-J4E9dvcle619SDrId5bC7k0MceOgfUpb_slNLgblY9p86M5AQt54snAGGKkZaXvzuVP2FNVVoyn98xnkuD-L0oRPldSdFcf_jZ_tbrq0vszT8N95cX1OG4Eu4Ny2A-vvuBQQaonOwFHSdRItrkLiuv0; _cs_mk_ga=0.28756841402236155_1726824831698; apt.sid=AP-9R2ZHMD84Z2N-2-4-1726825487813-21248864; ai_session=KdpXB1FSCzwnZxdHJaXtb1|1726824831827|1726825707185; _dc_gtm_UA-2681518-43=1; _dc_gtm_UA-12345678-1=1; _ga=GA1.1.835383240.1721915872; _ga_31HEW6ZFRB=GS1.1.1726824833.11.1.1726825707.60.0.33503968; _ga_86SWJ0ZT3B=GS1.1.1726824832.11.1.1726825707.60.0.0; _ga_1234=GS1.1.1726824834.11.1.1726825707.0.0.0; _uetsid=38afeef076a511ef996d7d8f71d618ae; _uetvid=e4a227604a8d11efa738398724a2366c', // Truncated for brevity
    'Priority': 'u=1, i',
    'Sec-CH-UA': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
    'Sec-CH-UA-Mobile': '?0',
    'Sec-CH-UA-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'no-cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  };

  try {
    const response = await axios.get(url, {
      headers,
      maxRedirects: 10,
      timeout: 30000,
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }), // Disable SSL verification
    });

    return { statusCode: response.status, data: response.data, headers: response.headers };
  }
   catch (error) {
    throw error;
  }
};

async function fetchEpiServerContentMultiUrl(urls, lang) {
  try {
    const results = await Promise.all(urls.map((u) => fetchEpiServerContent(u, lang)));
    return results;
  } catch (error) {
    console.error('Error fetching URLs:', error);
  }
}


const getMigrationContent = async(lang, parkId, authToken, url) => {

    
    const response = await fetchEpiServerContent(`${url}`, lang);

    const data = response.data;

    let obj = {};

    if(data.length > 0) {

      obj = data[0]    
    }

    return obj
} 

const getParkDetailsPages = async(lang) => {

  const url = `${process.env.SITECORE_MAIN_SITE_URL}/parkdetailpage/getallparkpages/?locale=${lang}`;
  
  try {
    const response = await axios.get(url,  {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      maxRedirects: 10,
      timeout: 30000,
    });

    return response.data
  } catch (error) {
     handleError(error)
  }
}

function readExcelFile(filePath) {
  // Read the file
  const workbook = XLSX.readFile(filePath);
  
  // Get the name of the first sheet
  const sheetName = workbook.SheetNames[0];
  
  // Get the data from the first sheet
  const worksheet = workbook.Sheets[sheetName];

  // Convert the sheet data to JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  return jsonData;

}

function readColumn(filePath, index) {
  // Read the workbook
  const workbook = XLSX.readFile(filePath);
  
  // Get the first sheet name
  const sheetName = workbook.SheetNames[0];
  
  // Get the first sheet
  const sheet = workbook.Sheets[sheetName];
  
  // Convert the sheet to JSON format with each row as an array
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const columnData = data.map(row => row[index]);

  return columnData;

}



function createNestedJsonObject(keys, values) {

  const jsonObject = {};

  for (const key in keys) {
      if (keys.hasOwnProperty(key)) {
          const expectedType = keys[key];
          const value = values[key];

          // Split the key by '/' to create nested structure
          const keyParts = key.split('/');
          let currentLevel = jsonObject;

          for (let i = 0; i < keyParts.length; i++) {
              const part = keyParts[i];

              // If we're at the last part, check type and assign value
              if (i === keyParts.length - 1) {
                  if (expectedType === 'array') {
                      // Initialize as an array if it doesn't exist
                      if (!currentLevel[part]) {
                          currentLevel[part] = [];
                      }
                      if(value.length > 0) {
                        currentLevel[part].push(value); // Add the value to the array
                      }
                  } else if (expectedType === 'string') {
                      currentLevel[part] = value; // Assign the string value
                  }
              } else {
                  // Create a nested object if it doesn't exist
                  if (!currentLevel[part]) {
                      currentLevel[part] = {};
                  }
                  currentLevel = currentLevel[part]; // Move to the next level
              }
          }
      }
  }

  return jsonObject;
}

function getValueByKeyPath(obj, keyPath) {

  const keys = keyPath.split('/');
  let current = obj;

  for (const key of keys) {
      if (current && key in current) {
          current = current[key];
      } else {
          // If the key does not exist, return undefined
          return undefined;
      }
  }

  return current;

}

const getChildKeysIncludingStrings = (keys) => {

    const mappedKeys = {};

    let existKeys = [];

    for (const key in keys) {

        if (keys.hasOwnProperty(key) && keys[key].type === 'array') {

            const keyParts = key.split('/');
          
            const parentKey = keyParts.join('/'); // Full key for the array

            // Initialize the array for storing child keys under this parent

            existKeys.push(parentKey);

            mappedKeys[parentKey] = {}

            mappedKeys[parentKey]['source'] = keys[key].source;

            mappedKeys[parentKey]['type'] = keys[key].type;

            mappedKeys[parentKey]['data'] = [];

            // Find all child keys of this array
            for (const childKey in keys) {
                if (keys.hasOwnProperty(childKey) && childKey.startsWith(parentKey + '/')) {
                    const childKeyName = childKey.split('/').pop(); // Get the child key name

                    existKeys.push(keys[childKey]['target']);

                    mappedKeys[parentKey]['data'].push({
                        key: childKeyName, // Child key name
                        ...keys[childKey] // Include type and map properties
                    });
                }
            }
        }
    }

    // Include string keys that are not under array parents
    for (const key in keys) {

        if (!existKeys.includes(key)) {
          mappedKeys[key] = {}
          mappedKeys[key]['data'] = keys[key]
        }
    }

    return mappedKeys;
}

const mappedValues = (epiContent, mapped, columnBData, columnCData, source ) => {
  value = ''
  if(source === 'EPI') {
    value = getValueByKeyPath(epiContent, mapped)
  }
  if(source === 'Excel') {
    const findIndex = columnBData.findIndex((c) => c === mapped);
    if(findIndex >= 0) {
      if(columnCData && columnCData[findIndex]) {
        value = columnCData[findIndex]
      }
    }
  }
  return value;
}

const extractContent = async() => {

  let loadingMessage = 'Downloading';
    
  let loadingInterval;

  // Start the loading indicator
  loadingInterval = setInterval(() => {
      process.stdout.write(`\r${loadingMessage}...`);
      loadingMessage += '.';
  }, 500); //

  
  try {

      const authToken = await authenticate();

      let parkId = argv.parkId; 

      const outPutPath = argv.outPutPath;

      const inputFile = argv.inputFile;

      const accFiles = argv.accFile;

      const fileName = argv.fileName ? argv.fileName : 'merge.json'

      const accData = [];

      if(!outPutPath) {
        console.log('OutPut Path is not specified');
        clearInterval(loadingInterval);
        return;
      }

      if(!inputFile) {
        console.log('Input File is not specified');
        clearInterval(loadingInterval);
        return;
      }

      if(accFiles) {
        const accFileArr = accFiles.split(',');
        let isAccExist = true;
        for(let i = 0; i < accFileArr.length; i++) {
            const accFile = accFileArr[i];
            if (fs.existsSync(inputFile)) {
              const extname = path.extname(inputFile).toLowerCase();
              if (extname !== '.xls' && extname !== '.xlsx') {
                 isAccExist = false;
                 break;
              }
            } else {
              isAccExist = false;
              break;
            }

        }
        if (!isAccExist) {
          console.log('Accomodation files are not exists or not correct in format.');
          clearInterval(loadingInterval);
          return;
        }
      }

      if(inputFile) {
        if (fs.existsSync(inputFile)) {
          const extname = path.extname(inputFile).toLowerCase();
          if (extname !== '.xls' && extname !== '.xlsx') {
              console.log('Input File is not xls or xlsx');
              clearInterval(loadingInterval);
              return;
          }
        } else {
          console.log('Input File path is not correct');
          clearInterval(loadingInterval);
          return;
        }
      }

      const columnAData = readColumn(inputFile, 0);

      const columnBData = readColumn(inputFile, 1);

      const columnCData = readColumn(inputFile, 2);

      if(!parkId) {
        
        const findIndex = columnAData.findIndex((a) => a === 'Park Id')

        if(findIndex >= 0) {
          parkId = columnBData[findIndex]
        } else {
          console.log('Park Id is not specified');
          clearInterval(loadingInterval);
          return;
        }
      
      }

      if(accFiles) {
        const accFileArr = accFiles.split(',');
        let isAccExist = true;
        for(let i = 0; i < accFileArr.length; i++) {
          const accFile = accFileArr[i]
          const accFileColumnBData = readColumn(accFile, 1);
          const accFileColumnCData = readColumn(accFile, 2);
          accData.push({
            columnB: accFileColumnBData,
            columnC: accFileColumnCData
          })
        }
      }
      
      const parkDetails = await getExtractContent('', authToken, parkId, 'parks' )

      
      if(!parkDetails) {
        console.log('Not able to find parkdetails. Please pass correct park id');
        clearInterval(loadingInterval);
        return;
      }

      const parkDetailsPages = await getParkDetailsPages('en')
  
      let epiContent = {};
  
      if(parkDetailsPages) {
        const findPark = parkDetailsPages.find((p) => p.Id == parkId);
        if(findPark) {
          const url =   new URL(findPark.Url);
          if(url) {
            epiContent = await getMigrationContent('en', parkId, authToken, url);
          }
        }
      }
      
      const mappingExcelData = readExcelFile('Mapped.xlsx');

      let keys = {};
     
      mappingExcelData.forEach((me) => {
        keys[me.Target] = {
          type: me.Type === 'Array' ? 'array' : 'string',
          mapped: me.Mapped ? me.Mapped : '',
          target: me.Target,
          source: me.Source
        }
      })

      const keyMapping  = getChildKeysIncludingStrings(keys);
      
      let values = {};
      let updatedKeys = {};
      for(let key in keyMapping) {
        const data = keyMapping[key]['data'];
        const dataSource = keyMapping[key]['source'];
        const dataType= keyMapping[key]['type'];
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
          const { target, source, mapped, type } = data;
          values[key] = mappedValues(epiContent, mapped, columnBData, columnCData, source );
          updatedKeys[key] = type;
        } else {
          updatedKeys[key] = dataType;
          if(dataSource === 'ACC') {
            values[key] = accData.map((a) => {
              const { columnB, columnC } = a;
              const obj = {}
              data.forEach(element => {
                 const { mapped,  key } = element;
                 const findIndex = columnB.findIndex((b) => b === mapped);
                 if(findIndex >= 0) {
                    obj[key] = columnC[findIndex]
                 }
              });
              return obj
            }).filter((a) => Object.keys(a).length > 0);
          } else {
            values[key] = []
          }
        }
      }

     
      const destinationFolder = path.join(outPutPath);

      
      await fetchDataAndWriteFiles([{
        file: fileName,
        data: createNestedJsonObject(updatedKeys, values),
      }], destinationFolder);


      console.log(`File created: ${path.join(destinationFolder, fileName)}`)

      clearInterval(loadingInterval); // Stop the loading indicator

  } catch (error) {

    clearInterval(loadingInterval);

    console.error('Error:', error);
  }
}

extractContent();