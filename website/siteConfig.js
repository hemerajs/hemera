/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* List of projects/orgs using your project for the users page */

const baseUrl = '/hemera/'

function imgUrl(img) {
  return baseUrl + 'img/' + img
}

const users = [
  {
    caption: 'appcom interactive',
    image: imgUrl('company/appcom.svg'),
    infoLink: 'http://www.appcom-interactive.de/',
    pinned: true
  },
  {
    caption: 'amerbank',
    image: imgUrl('company/amerbank.png'),
    infoLink: 'https://amerbank.com/',
    pinned: true
  },
  {
    caption: 'savicontrols',
    image: imgUrl('company/savi.png'),
    infoLink: 'https://www.savicontrols.com/',
    pinned: true
  }
]

const siteConfig = {
  title: 'Hemera' /* title for your website */,
  tagline: 'Writing reliable & fault-tolerant microservices in Node.js',
  url: 'https://hemerajs.github.io/hemera/' /* your website url */,
  baseUrl: '/hemera/' /* base url for your project */,
  noIndex: false,
  headerLinks: [
    { doc: 'what-is-hemera', label: 'Docs' },
    { page: 'help', label: 'Help' },
    { blog: true, label: 'Blog' },
    { search: true }
  ],
  users,
  /* path to images for header/footer */
  headerIcon: 'img/hemera-tiny.png',
  footerIcon: 'img/hemera-blackwhite.png',
  favicon: 'img/favicon.png',
  /* colors for website */
  colors: {
    primaryColor: '#000000',
    secondaryColor: '#665d79'
  },
  /* custom fonts for website */
  /*fonts: {
    myFont: [
      "Times New Roman",
      "Serif"
    ],
    myOtherFont: [
      "-apple-system",
      "system-ui"
    ]
  },*/
  // This copyright info is used in /core/Footer.js and blog rss/atom feeds.
  copyright: 'Copyright © ' + new Date().getFullYear() + ' Dustin Deus',
  organizationName: 'hemerajs', // or set an env variable ORGANIZATION_NAME
  projectName: 'hemera', // or set an env variable PROJECT_NAME
  highlight: {
    // Highlight.js theme to use for syntax highlighting in code blocks
    theme: 'default'
  },
  scripts: ['https://buttons.github.io/buttons.js'],
  // You may provide arbitrary config keys to be used as needed by your template.
  repoUrl: 'https://github.com/hemerajs/hemera/'
  /* On page navigation for the current documentation page */
  // onPageNav: 'separate'
}

module.exports = siteConfig
