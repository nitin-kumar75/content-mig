require('dotenv').config();


const https = require('https')

const axios = require('axios');

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
})

const axiosInstance = axios.create({
  httpsAgent: httpsAgent,
})

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

const ACC_PATH = `Accommodation Details`;

const PARK_PATH = `Park Details`;

var _ = require('lodash');
const { error } = require('console');

const APIURL = process.env.MOBILE_APIURL;


const getPath = (lang) => {

  const obj = {
    en: {
      DOMAIN: `${process.env.MOBILE_CONTENT_EN_DOMAIN}`,
      TRAVEL_INFORMATION: `/travel-information`,
      IN_AND_AROUND: `/in-and-around-the-house`,
      SERVICE_CONTACT: `/service-contact`,
      PARK_RULES: `/park-rules`,
      ORDER_INFO: `/facilities/food-drinks/order-fresh-bread-rolls`,
      FACILITIES: `/facilities`
    },
    nl: {
      DOMAIN: `${process.env.MOBILE_CONTENT_NL_DOMAIN}`,
      TRAVEL_INFORMATION: `/reisinformatie`,
      IN_AND_AROUND: `/in-en-rondom-huis`,
      SERVICE_CONTACT: `/service-contact`,
      PARK_RULES: `/parkregels`,
      ORDER_INFO: `/faciliteiten/eten-drinken/broodjes-bestellen`,
      FACILITIES: `/faciliteiten`
    },
    de: {
      DOMAIN: `${process.env.MOBILE_CONTENT_DE_DOMAIN}`,
      TRAVEL_INFORMATION: `/reiseinformationen`,
      IN_AND_AROUND: `/im-und-um-das-haus-herum`,
      SERVICE_CONTACT: `/service-kontakt`,
      PARK_RULES: `/parkregels`,
      ORDER_INFO: `/einrichtungen/essen-trinken/brotchen-bestellen/`,
      FACILITIES: `/einrichtungen`
    },
    fr: {
      DOMAIN: `${process.env.MOBILE_CONTENT_FR_DOMAIN}`,
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
    username: process.env.MOBILE_API_USERNAME,
    password: process.env.MOBILE_API_PASSWORD,
  });

  try {
    const response = await axiosInstance.post(url, data.toString(), {
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


const deleteFolderIfExists = async(folder) => {
  if (fs.existsSync(folder)) {
    await fs.promises.rm(folder, { recursive: true, force: true });
  }
};

const createFolder = (folder, isChildFolder) => {

  if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
      if(isChildFolder) {
        fs.mkdirSync(`${folder}/${PARK_PATH}`);
        fs.mkdirSync(`${folder}/${ACC_PATH}`);
      }
  } else {
      console.log(`Folder already exists: ${folder}`);
  }
};

const createChildFolder = (folder) => {

  if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
  } else {
      console.log(`Folder already exists: ${folder}`);
  }
};

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


const downloadZIP = async(parkId, files, outPutPath) => {

    

    const destinationFolder = path.join(outPutPath);
  
    const zipFilePath = path.join(destinationFolder, `Park_${parkId}.zip`);

    if (!fs.existsSync(destinationFolder)){
        fs.mkdirSync(destinationFolder);
    }

    const output = fs.createWriteStream(zipFilePath);

    const archive = archiver('zip');

    output.on('close', () => {
      console.log(`ZIP file created: ${zipFilePath} (${archive.pointer()} total bytes)`);
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(output);

    files.forEach(item => {
      archive.append(JSON.stringify(item.data, null, 2), { name: item.file });
    });

    archive.finalize();

  
};


async function getAccommodationByResourceId(token, resourceId) {

  const url = `${APIURL}/accommodations?resourceId=${resourceId}&supplierId=51&auth_token=${token}`;

  try {
    const response = await axiosInstance.get(url,  {
      headers: {
        'Content-Type': 'application/json',
      },
      maxRedirects: 10,
      timeout: 30000,
    });

    return response.data
  } catch (error) {
    handleError(error)
  }
}


async function getOpeningTimes(lang, token, parkId, page = 1) {

  let url = `${APIURL}/openingtimes?language=${lang}&objectId=${parkId}&auth_token=${token}&page=${page}`;

  if(lang === '') {
    url = `${APIURL}/openingtimes?objectId=${parkId}&auth_token=${token}&page=${page}`;
  }

  try {
    const response = await axiosInstance.get(url, {
      maxRedirects: 10,
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    handleError(error)
  }
}

async function getParkDetails(lang, token, parkId) {

  let url = `${APIURL}/parks/${parkId}?language=${lang}&auth_token=${token}`;

  if(lang === '') {
    url = `${APIURL}/parks/${parkId}?auth_token=${token}`;
  }

  try {
    const response = await axiosInstance.get(url, {
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
    const response = await axiosInstance.get(url, {
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
    const response = await axiosInstance.get(url, {
      maxRedirects: 10,
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    handleError(error)
  }
}


async function getParkMapImage(lang, token, parkId) {

  const typeId = '10039';

  const url = `${APIURL}/images?language=${lang}&objectId=${parkId}&typeId=${typeId}&auth_token=${token}`;

  try {
    const response = await axiosInstance.get(url, {
      maxRedirects: 10,
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    handleError(error)
  }
}

async function getImages(lang, token, objectId) {

  const url = `${APIURL}/images?language=${lang}&objectId=${objectId}&auth_token=${token}`;

  try {
    const response = await axiosInstance.get(url, {
      maxRedirects: 10,
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
     handleError(error)
  }
}


async function getActivities(token, parkId, isBookerPageId, lang, page=1) {

  const path = isBookerPageId ?  `booker25` : `leisure`

  const url = `${APIURL}/${path}?objectId=${parkId}&auth_token=${token}&page=${page}`;

  try {
    const response = await axiosInstance.get(url, {
      maxRedirects: 10,
      timeout: 30000,
    });

    const data = response.data;

    return data;

  } catch (error) {
     handleError(error)
  }
}

async function getVicinities(token, parkId, lang, page=1) {

  let url = `${APIURL}/tipstrips?objectId=${parkId}&language=${lang}&auth_token=${token}`;

  try {
    const response = await axiosInstance.get(url, {
      maxRedirects: 10,
      timeout: 30000,
    });

    const data = response.data;

    return data;
  } catch (error) {
     handleError(error)
  }
}

const fetchEpiServerContent = async (contentUrl, lang) => {

  const config = getPath(lang);

  const url = `${config.DOMAIN}${process.env.MOBILE_EPISERVERURL}?ContentUrl=${contentUrl}`;

  let updateLang = ''
  if(lang === 'en') {
    updateLang = 'en-US,en;q=0.9';
  }

  // Set up the headers
  const headers = {
    'Accept': '*/*',
    'Accept-Language': updateLang || 'en-US,en;q=0.9', 
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
    const response = await axiosInstance.get(url, {
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
    const response = await axiosInstance.get(url, {
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

async function getFoodDrinks(foodBlocksUrl, lang, openingTimesItems) {

  const foodDrinksResults = await fetchEpiServerContentMultiUrl(foodBlocksUrl, lang)

  const foodAndDrinks = [];
        
  foodDrinksResults.forEach((result, index) => {

    const data = result.data;

    const { 
      name, 
      routeSegment, 
      sliderImage, 
      title, 
      content, 
      image, 
      imageMobile, 
      highlightedCTA,
      facilityOpeningTimes 
    } = data[0]

    // const facilityId = facilityOpeningTimes?.facilityId?.value;

    // const filterOpeningTimes = openingTimesItems && openingTimesItems.filter((o) => o.facilityId === facilityId);
    
    // let availability = [];
    
    // if(filterOpeningTimes && filterOpeningTimes.length > 0) {
    //   availability = filterOpeningTimes[0].availability;
    // }

    foodAndDrinks.push({
      sliderImage: sliderImage?.value, 
      title: title?.value, 
      content: content?.value, 
      image: image?.value, 
      imageMobile: imageMobile?.value, 
      highlightedCTA: highlightedCTA?.value,
      facilityOpeningTimes
    })
  });

  return foodAndDrinks;

}

async function getOrderForms(url, lang,) {

  const orderFormResults = await fetchEpiServerContent(url, lang)

  const orderFormResultsData = orderFormResults.data;

  let obj = {};
  
  if(orderFormResultsData.length > 0) {
    const { 
      intro, 
      name, 
      routeSegment, 
      sliderImage, 
      title, 
      content, 
      image, 
      imageMobile,
      productItems,
      formFields,
      closingTime,
      maxDateOffset,
      maxDateOffsetType,
      dateFieldName,
      datePlaceholder,
      emailOrderForm,
      backendMailSubject,
      backendMailBody,
      customerMailSubject,
      customerMailPreHeader,
      customerMailBody,
      parkMenuIcon,
      category,
    } = orderFormResultsData[0];

    let updatedItems = [];
    if(productItems) {
      const { expandedValue } = productItems;
      if(expandedValue && expandedValue.length > 0) {
        updatedItems = expandedValue.map((e) => {
          return {
            name: e.name && e.name.value,
            price: e.price?.value,
            minimumOrdered: e.minimumOrdered?.value,
            maximumOrdered: e.maximumOrdered?.value,
            dutchNameForInternalUse: e.dutchNameForInternalUse?.value
          }
        })
      }
    }

    obj = {
      intro: intro?.value, 
      name: name?.value, 
      sliderImage: sliderImage?.value, 
      title: title?.value, 
      content: content?.value, 
      image: image?.value, 
      imageMobile: imageMobile?.value,
      productItems: updatedItems,
      formFields: formFields?.value,
      closingTime: closingTime?.value,
      maxDateOffset: maxDateOffset?.value,
      maxDateOffsetType: maxDateOffset?.value,
      dateFieldName: dateFieldName?.value,
      datePlaceholder: datePlaceholder?.value,
      emailOrderForm: emailOrderForm?.value,
      backendMailSubject: backendMailSubject?.value,
      backendMailBody: backendMailBody?.value,
      customerMailSubject: customerMailBody?.value,
      customerMailPreHeader: customerMailPreHeader?.value,
      customerMailBody: customerMailBody?.value,
      parkMenuIcon: parkMenuIcon?.value,
      category: category?.value
    }

  }

  return obj

}

async function getFacilities(domain, parkName, openingTimesItems, lang) {

  const config = getPath(lang);

  const facilitiesResponse = await fetchEpiServerContent(`${domain}/${parkName}${config.FACILITIES}`, lang);

  const facilitiesData = facilitiesResponse.data;

  let obj = {};
  
  if(facilitiesData.length > 0) {

      const { contentLink, 
        name, 
        routeSegment, 
        sliderImage, 
        title, 
        content, 
        image, 
        imageMobile   
      } = facilitiesData[0];

      const facilityList = [];

      const contentId = contentLink.id

      const childrenResponse = await fetchEpiServerChilderens(contentId, lang);

      const childrenData = childrenResponse.data;

      childrenData.forEach((result, index) => {
      
          
          const { 
            name, 
            routeSegment, 
            sliderImage, 
            title, 
            content, 
            image, 
            imageMobile, 
            facilityOpeningTimes 
          } = result

          // const facilityId = facilityOpeningTimes?.facilityId?.value;

          //  const filterOpeningTimes = openingTimesItems && openingTimesItems.filter((o) => o.facilityId === facilityId);

          // let availability = [];
          
          // if(filterOpeningTimes && filterOpeningTimes.length > 0) {
          //   availability = filterOpeningTimes[0].availability;
          // }

          facilityList.push({
            name, 
            routeSegment, 
            sliderImage: sliderImage?.value, 
            title: title?.value, 
            content: content?.value, 
            image: image?.value, 
            imageMobile: imageMobile?.value, 
            facilityOpeningTimes 
          })
      });

      obj = {
        name, 
        routeSegment, 
        sliderImage: sliderImage?.value, 
        title: title?.value, 
        content: content?.value, 
        image: image?.value, 
        imageMobile: imageMobile?.value, 
        list: facilityList
      }
  
  }

  return obj;

}

async function getMoreInformation(domain, parkName, lang, path) {

  const travleInformationResponse = await fetchEpiServerContent(`${domain}/${parkName}/${path}`, lang);

  const travleInformationResponseData = travleInformationResponse.data;

  let obj = {};
  
  if(travleInformationResponseData.length > 0) {

      const { contentLink, 
        name, 
        routeSegment, 
        sliderImage, 
        title, 
        content, 
        image, 
        imageMobile   
      } = travleInformationResponseData[0];

      const items = [];

      const contentId = contentLink.id

      const childrenResponse = await fetchEpiServerChilderens(contentId, lang);

      const childrenData = childrenResponse.data;

      childrenData.forEach((result, index) => {
          
          const { 
            name, 
            title, 
            mainContentArea,
            content,
            allUsersTravelInfoContentArea,
            noReservationInfo
          } = result

          const obj = {
            title: name,
            content: content?.value
          };

          if(mainContentArea) {
 
            const { expandedValue: mExpandedValue } = mainContentArea

          
            const main = [];

            mExpandedValue && mExpandedValue.forEach((ex, index) => {
              main.push(ex.text && ex.text.value) 
            })

            obj.mainContent = main;
          
          }

          if(allUsersTravelInfoContentArea) {

              const {  expandedValue: aExpandedValue } = allUsersTravelInfoContentArea;

              const userTips = [];
              aExpandedValue && aExpandedValue.forEach((ex, index) => {
                userTips.push(ex.text && ex.text.value) 
              })

              obj.tipInfo = userTips;
          }

          if(noReservationInfo) {

            const {  expandedValue: rExpandedValue } = noReservationInfo;

            const checkout = [];
            rExpandedValue && rExpandedValue.forEach((ex, index) => {
              checkout.push(ex.text && ex.text.value) 
            })

            obj.checkout = checkout;
        }

          items.push(obj)

          
      });

      obj = {
        sliderImage: sliderImage?.value, 
        title: title?.value, 
        content: content?.value, 
        image: image?.value, 
        imageMobile: imageMobile?.value, 
        list: items
      }
  
  }

  return obj;

}

const filterProperty = (str, data, lang) => {
   const filterData = data.filter((d) => d.sysname === str)
   let content = ''
   if(filterData.length > 0) {
      const langData = filterData[0].lang;
      const langFilter = langData.filter((d) => d.language === lang);
      if(langFilter.length > 0) {
        content = langFilter[0].value;
      }
    }
    return content
}


const filterMap = (str, data, lang) => {
  const filterData = data.filter((d) => d.sysname === str)
  let content = ''
  if(filterData.length > 0) {
     const langData = filterData[0].lang;
     const langFilter = langData.filter((d) => d.language === lang);
     if(langFilter.length > 0) {
       content = langFilter[0].uri;
     }
   }
   return content
}

const getMoreItems = async(lang, data, authToken, numpages, type, objectId) => {

  let items = data;

  let promises = []
  
  for(let i = 2; i <= numpages; i++) {
    
    if(type === 'getOpenTimes') {
      promises.push(getOpeningTimes(lang, authToken, objectId, i))
    }

    if(type === 'getOpenTimes') {
      promises.push(getActivities(authToken, objectId, false, 'en', i ))
    }

    if(type === 'images') {
      promises.push(getExtractContent('', authToken, objectId, 'images' ))
    }

  }

  const results = await Promise.all(promises);
    
  if(results.length > 0) {
      for(let i = 0; i < results.length; i++) {
          const item = results[i].items;
          items.push(
            ...item
          )
      }
  }

  return items

}

const getMigrationContent = async(lang, parkId, authToken, slug) => {

    const parkName = slug;

    const config = getPath(lang);

    const domain = config.DOMAIN;

    const response = await fetchEpiServerContent(`${domain}/${parkName}/`, lang);

    const data = response.data;

    const obj = {};

    if(data.length > 0) {

       const { contentLink, name, routeSegment, foodAndDrinksBlock, id, isLoggedInCheckoutEnabled, isQRCheckoutEnabled, isDigitalKeyEnabled } = data[0];
      
       obj.name = name;

       obj.parkId = id?.value;


       obj.isLoggedInCheckoutEnabled = isLoggedInCheckoutEnabled?.value
       
       obj.isQRCheckoutEnabled = isQRCheckoutEnabled?.value

       obj.isDigitalKeyEnabled = isDigitalKeyEnabled?.value

       
       // const openingTimes = await getOpeningTimes(lang, authToken, obj.parkId )

       // const parkDetails = await getParkDetails(lang, authToken, obj.parkId )

      
       const parkMapImage = await getParkMapImage(lang, authToken, obj.parkId);

       // const vicinities = await getVicinities(authToken, obj.parkId, lang)

       // const openingTimesItems = openingTimes?.items;
       
       const foodBlocksUrl = [];

       const foodAndDrinks = [];

       if(foodAndDrinksBlock) {

           const infoPages = foodAndDrinksBlock.infoPages
        
           const infoPagesValues = infoPages?.value

           if(infoPagesValues !== null) {
            for(let i = 0; i < infoPagesValues.length; i++) {
            
              const infoPageValue = infoPagesValues[i];
            
              foodBlocksUrl.push(infoPageValue.url)
            
            }
           }
       }

       if(foodBlocksUrl.length > 0) {
          
          obj.foodAndDrinks = await getFoodDrinks(foodBlocksUrl, lang, []);

          obj.orderFormInformation = await getOrderForms(`${domain}/${parkName}${config.ORDER_INFO}&expand=*`, lang)
       }
       
       obj.facility = {
        ...await getFacilities(domain, parkName, [], lang)
       }


      
       // obj.vicinities = vicinities;

       obj.travelInfromation = {
        ...await getMoreInformation(domain, parkName, lang, config.TRAVEL_INFORMATION)
       }

       obj.inAndRoundInformation = {
        ...await getMoreInformation(domain, parkName, lang, config.IN_AND_AROUND)
       }

       obj.parkRulesInformation = {
        ...await getMoreInformation(domain, parkName, lang, config.PARK_RULES)
       }

       obj.serviceContactInformation = {
        ...await getMoreInformation(domain, parkName, lang, config.SERVICE_CONTACT)
       }

       const park = {};

      //  if(parkDetails) {

      //     const { items } = parkDetails

      //     if(items.length > 0) {

      //        const item = items[0];
      //        park.lat = item.latitude;
      //        park.lng = item.longitude;
             
      //        park.city = item.city;

      //        const langs = item.lang
             
      //        const langFilter = langs && langs.filter((d) => d.language === lang);

      //        if(langFilter && langFilter.length > 0) {

      //         const l = langFilter[0]
      //         park.parkName = l.name;
      //         park.country = l.country.name;
      //         park.region = l.region.name;

      //        }



      //        const { properties} = item;
      //        if(properties.length > 0) {

      //           park.videos = filterProperty('park_video', properties, lang)

      //           park.jimani_key = filterProperty('park_jimanikey', properties, lang)

      //           const streetProperty = filterProperty('park_streetname', properties, lang)

      //           const houseNrProperty = filterProperty('park_housenr', properties, lang)

      //           const filterLeisurehubActivities = filterProperty('park_leisurehub_token', properties, lang)

      //           if(filterLeisurehubActivities !== null && filterLeisurehubActivities !== '') {
      //             hasLeisurehubActivities = true;
      //           }

      //           const filterBooker25PageId = filterProperty('park_booker25_page_id', properties, lang)

      //           if(filterBooker25PageId !== null && filterBooker25PageId !== '') {
      //             isBookerPageId = true;
      //           }

              
      //           const address = [];
      //           if(streetProperty) {
      //             address.push(streetProperty)
      //           }
      //           if(houseNrProperty) {
      //             address.push(houseNrProperty)
      //           }
      //           if(address.length > 0) {
      //             park.address = address.join(" ")
      //           }

      //           const postalCodeProperty = filterProperty('park_postalcode', properties, lang)

      //           if(postalCodeProperty) {
      //             park.postalCode = postalCodeProperty
      //           }

      //           const phoneNrProperty = filterProperty('park_phonenr', properties, lang)

      //           if(phoneNrProperty) {
      //             park.phoneNr = phoneNrProperty
      //           }
  
      //        } 
      //     }
      //  }

       if(parkMapImage) {
        const { items } = parkMapImage
        if(items.length > 0) {
           const item = items[0];
           const { pristine} = item;
           if(pristine.length > 0) {
              park.map = filterMap('park-map-parkmap-fixed-width', pristine, lang)
           } 
        }
       }

       obj.parkDetails = {
        ...park,
       }

      // const activities = await getActivities(authToken, obj.parkId, isBookerPageId, lang);

      // obj.activities = activities;
       
    }

    return obj
} 

const getParkDetailsPages = async(lang) => {

  const url = `${process.env.MOBILE_MAIN_SITE_URL}/parkdetailpage/getallparkpages/?locale=${lang}`;
  
  try {
    const response = await axiosInstance.get(url,  {
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

    const parkId = argv.parkId; 

    const outPutPath = argv.outPutPath;

    if(!parkId) {
      console.log('ParkId is not specified');
      clearInterval(loadingInterval);
      return;
    }

    if(!outPutPath) {
      console.log('OutPut Path is not specified');
      clearInterval(loadingInterval);
      return;
    }

     
      const parkDetails = await getExtractContent('', authToken, parkId, 'parks' )

    
      if(!parkDetails) {
        console.log('Not able to find parkdetails. Please pass correct park id');
        clearInterval(loadingInterval);
        return;
      }

      const parkDetailsPages = await getParkDetailsPages('en')
  
      let contentMigration = [];
      
      // demo park site is not working
      if(parkDetailsPages) {
        const findPark = parkDetailsPages.find((p) => p.Id == parkId);
        if(findPark) {
          const url =   new URL(findPark.Url);
          const pathSegments = url.pathname.split('/').filter(segment => segment !== ''); // Split and filter out empty segments
          const slug = pathSegments.pop(); //
          if(slug) {
            const enContent = await getMigrationContent('en', parkId, authToken, slug);
            const nlContent = await getMigrationContent('nl', parkId, authToken, slug);
            const deContent = await getMigrationContent('de', parkId, authToken, slug);
            const frContent = await getMigrationContent('fr', parkId, authToken, slug);
            contentMigration = [
              {
                file: `${PARK_PATH}/ContentMigration_P${parkId}.json`, 
                data: {
                  en: enContent,
                  nl: nlContent,
                  de: deContent,
                  fr: frContent
                }
              }
            ]
  
          }
        }
      }
    
      const allAcommodationDetails = await getExtractContent('', authToken, parkId, 'accommodations' ) 
      
      const allImagesDetails = await getExtractContent('', authToken, parkId, 'images' ) 
  
      const openingTimes = await getOpeningTimes('', authToken, parkId )
  
      const openingTimesItems = await getMoreItems('', openingTimes.items, authToken, openingTimes?.page?.numpages , 'getOpenTimes')
  
      const vicinities = await getVicinities(authToken, parkId, 'en')
  
      const activities = await getActivities(authToken, parkId, false, 'en', 1 )
  
      const activitiesItems = await getMoreItems('', activities.items, authToken, activities?.page?.numpages , 'getActivities')
      
  
      let accommodationObjectIds = []
  
      if(allAcommodationDetails && allAcommodationDetails.items?.length > 0) {
          accommodationObjectIds = allAcommodationDetails.items.map((a) => {
            return a.objectId;
          });
      }
  
      let individualAccomodation = [];
  
      if(accommodationObjectIds.length > 0) {
  
        const results = await Promise.all(accommodationObjectIds.map((u) => getExtractContent('', authToken, u, 'accommodation' )));
        
        if(results.length > 0) {
          individualAccomodation = accommodationObjectIds.map((acc, index) => {
            const ad = results[index]
            return {
              file: `${ACC_PATH}/Accommodation_${acc}/Accommodation_P${parkId}_A${acc}.json`, 
              data: ad,
              folder: `${ACC_PATH}/Accommodation_${acc}`
            }
          })
        }
      }
  
  
      let allImagesAcc = [];
  
      if(accommodationObjectIds.length > 0) {
        const results = await Promise.all(accommodationObjectIds.map((u) => getExtractContent('', authToken, u, 'images' )));
        if(results.length > 0) {
          allImagesAcc = await Promise.all(accommodationObjectIds.map(
            async(acc, index) => {
            const ad = results[index]
            let items = []
            if(ad) {
               items =  await getMoreItems('', ad.items, authToken, ad?.page?.numpages , 'images', acc)
            }
            return {
              file: `${ACC_PATH}/Accommodation_${acc}/ALlAccommodationImage_P${parkId}_A${acc}.json`, 
              data: {
                items
              },
              folder: `${ACC_PATH}/Accommodation_${acc}`
            }
          }))
        }
      }
  
      const files = [{
        file: `${PARK_PATH}/Park_${parkId}.json`, 
        data: parkDetails && parkDetails,
      }, 
      {
        file: `${PARK_PATH}/AllParkImages_P${parkId}.json`, 
        data: allImagesDetails && allImagesDetails,
      },
      {
        file: `${PARK_PATH}/OpeningTimes_P${parkId}.json`,
        data: openingTimesItems
      },
      {
        file: `${PARK_PATH}/Tips&Trips_P${parkId}.json`,
        data: vicinities && vicinities
      },
      {
        file: `${PARK_PATH}/Activities_P${parkId}.json`,
        data: activitiesItems
      },
      ...contentMigration,
      // {
      //   file: `Acc_${parkId}.json`, 
      //   data: allAcommodationDetails && allAcommodationDetails.items,
      // },
      ...individualAccomodation,
      ...allImagesAcc
     ]

      
      const destinationFolder = path.join(outPutPath);

      const folderName = `${destinationFolder}/Park_${parkId}`

      const sourceFolderName = `${folderName}/RP_Source`

      const parkFolderName = `${folderName}/RP_Source/Park_${parkId}`

      const preHarFolderName = `${folderName}/Pre_Harmonization/Park_${parkId}`

      const postHarFolderName = `${folderName}/Post_Harmonization/Park_${parkId}`

      await deleteFolderIfExists(folderName);

      createFolder(folderName, false);

      createFolder(`${sourceFolderName}`, false);

      createFolder(`${parkFolderName}`, true)

      createFolder(`${folderName}/Pre_Harmonization`, false);

      createFolder(`${preHarFolderName}`, true);

      createChildFolder(`${folderName}/Post_Harmonization`, false)

      createFolder(`${postHarFolderName}`, true);

      createFolder(`${folderName}/LOV_Stibo`, false);

      createFolder(`${folderName}/Park and Accomodation for Stibo`, false);

      const childFolders = [...individualAccomodation, ...allImagesAcc]

      const existAcc = [];

      for(let acc = 0; acc < childFolders.length; acc++) {
        const ad = childFolders[acc];
        if(ad.folder && !existAcc.includes(ad.folder)) {
          createChildFolder(`${parkFolderName}/${ad.folder}`);
          existAcc.push(ad.folder)
        }
      }

      const existPreAcc = [];
      for(let acc = 0; acc < childFolders.length; acc++) {
        const ad = childFolders[acc];
        if(ad.folder && !existPreAcc.includes(ad.folder)) {
          createChildFolder(`${preHarFolderName}/${ad.folder}`);
          existPreAcc.push(ad.folder)
        }
      }

      const existPostAcc = [];
      for(let acc = 0; acc < childFolders.length; acc++) {
        const ad = childFolders[acc];
        if(ad.folder && !existPostAcc.includes(ad.folder)) {
          createChildFolder(`${postHarFolderName}/${ad.folder}`);
          existPostAcc.push(ad.folder)
        }
      }

      
      await fetchDataAndWriteFiles(files, parkFolderName);

      await fetchDataAndWriteFiles(files, preHarFolderName);

      await fetchDataAndWriteFiles(files, postHarFolderName);

      console.log(`Folder created: ${folderName}`);

      clearInterval(loadingInterval); // Stop the loading indicator

  } catch (error) {

    clearInterval(loadingInterval);

    console.error('Error:', error);
  }
}

extractContent();