/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react')

const CompLibrary = require('../../core/CompLibrary.js')
const MarkdownBlock = CompLibrary.MarkdownBlock /* Used to read markdown */
const Container = CompLibrary.Container
const GridBlock = CompLibrary.GridBlock

const siteConfig = require(process.cwd() + '/siteConfig.js')
const javascript = (...args) => `~~~javascript\n${String.raw(...args)}\n~~~`
const bash = (...args) => `~~~bash\n${String.raw(...args)}\n~~~`

const json = object => `~~~json\n${JSON.stringify(object, null, 2)}\n~~~`

function imgUrl(img) {
  return siteConfig.baseUrl + 'img/' + img
}

function docUrl(doc, language) {
  return siteConfig.baseUrl + 'docs/' + (language ? language + '/' : '') + doc
}

function pageUrl(page, language) {
  return siteConfig.baseUrl + (language ? language + '/' : '') + page
}

class Button extends React.Component {
  render() {
    return (
      <div className="pluginWrapper buttonWrapper">
        <a className="button" href={this.props.href} target={this.props.target}>
          {this.props.children}
        </a>
      </div>
    )
  }
}

Button.defaultProps = {
  target: '_self'
}

const SplashContainer = props => (
  <div className="homeContainer">
    <div className="homeSplashFade">
      <div className="wrapper homeWrapper">{props.children}</div>
    </div>
  </div>
)

const Logo = props => (
  <div className="projectLogo">
    <img src={props.img_src} />
  </div>
)

const ProjectTitle = props => (
  <h2 className="projectTitle">
    <small>{siteConfig.tagline}</small>
  </h2>
)

const PromoSection = props => (
  <div className="section promoSection">
    <div className="promoRow">
      <div className="pluginRowBlock">{props.children}</div>
    </div>
  </div>
)

class HomeSplash extends React.Component {
  render() {
    let language = this.props.language || ''
    return (
      <SplashContainer>
        <Logo img_src={imgUrl('hemera.png')} />
        <div className="inner">
          <ProjectTitle />
          <PromoSection>
            <Button href="https://repl.it/@StarpTech/Hemera-6">
              Try It Out
            </Button>
            <Button href={docUrl('installation.html', language)}>
              Getting Started
            </Button>
            <Button href={docUrl('ecosystem.html', language)}>Plugins</Button>
          </PromoSection>
        </div>
      </SplashContainer>
    )
  }
}

const Block = props => (
  <Container
    padding={['bottom', 'top']}
    id={props.id}
    background={props.background}
  >
    <GridBlock align="center" contents={props.children} layout={props.layout} />
  </Container>
)

const Features = props => (
  <Block layout="fourColumn">
    {[
      {
        content:
          "Any subscription is managed by NATS. You don't need any service discovery. Total location transparency.",
        image: imgUrl('target.svg'),
        imageAlign: 'top',
        title: 'Scalability'
      },
      {
        content:
          'Auto-heals when new services are added. Configure cluster mode to increase reliability.',
        image: imgUrl('growth.svg'),
        imageAlign: 'top',
        title: 'Fault tolerance'
      },
      {
        content:
          'Providing reliable and modern plugins to the community e.g for RabbitMQ, Zipkin, Jaeger, Mongodb, Arangodb or Elasticsearch.',
        image: imgUrl('exchange.svg'),
        imageAlign: 'top',
        title: 'Plugins'
      },
      {
        content:
          'Hook into the server or client lifecycle with the help of extensions. Use middlewares or the validation library of your choice.',
        image: imgUrl('puzzle.svg'),
        imageAlign: 'top',
        title: 'Extensible'
      },
      {
        content:
          'Requests are load balanced (random) by NATS mechanism of "queue groups".',
        image: imgUrl('unity.svg'),
        imageAlign: 'top',
        title: 'Load Balancing'
      },
      {
        content:
          "Define the signatures of your RPC's in JSON and use the flexibility of pattern-matching.",
        image: imgUrl('connection.svg'),
        imageAlign: 'top',
        title: 'Pattern driven'
      },
      {
        content:
          'Transfer metadata across services or attach contextual data to tracing systems.',
        image: imgUrl('sharing.svg'),
        imageAlign: 'top',
        title: 'Metadata'
      },
      {
        content: 'Use custom serializer e.g MessagePack.',
        image: imgUrl('income.svg'),
        imageAlign: 'top',
        title: 'Serialization'
      }
    ]}
  </Block>
)

const FeatureCallout = props => (
  <div className="productShowcaseSection paddingBottom codeExampleContainer">
    <h2>Give it a try</h2>
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ marginTop: '25px' }}>Install NATS Client and Hemera</h3>
      <MarkdownBlock>{bash`npm install nats nats-hemera`}</MarkdownBlock>
      <h3>Install NATS Server</h3>
      <MarkdownBlock>{bash`
# Download NATS
https://nats.io/download/
# Start
./gnatsd
      `}</MarkdownBlock>
      <h3>Example</h3>
    </div>
    <div className="exampleContainer">
      <MarkdownBlock>
        {javascript`
  const Hemera = require('nats-hemera')
  const HemeraJoi = require('hemera-joi')
  const nats = require('nats').connect()

  const hemera = new Hemera(nats, {
    logLevel: 'info'
  })

  // set payload validator of your choice
  hemera.use(HemeraJoi)

  const start = async () => {
    try {
      // establish connection and bootstrap hemera
      await hemera.ready()

      // use exposed lib from plugin
      let Joi = hemera.joi

      // define your first server action
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          a: Joi.number().required(),
          b: Joi.number().required()
        },
        async function(req) {
          return req.a + req.b
        }
      )
      hemera.log.info('service listening')

      // start first request
      let response = await hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 10,
        b: 10
      })
      hemera.log.info(response.data)

      // keep the parent "context" to retain meta and trace informations
      response = await response.context.act({
        topic: 'math',
        cmd: 'add',
        a: 10,
        b: 10
      })
      hemera.log.info(response.data)
    } catch (err) {
      hemera.log.error(err)
      process.exit(1)
    }
  }
  start()`}
      </MarkdownBlock>
    </div>
  </div>
)

const WhatIsHemera = props => (
  <Block background="light">
    {[
      {
        content: `Hemera (/ˈhɛmərə/; Ancient Greek: Ἡμέρα [hɛːméra] "day") is a small wrapper around the NATS driver. NATS is a simple, fast and reliable solution for the internal communication of a distributed system. It chooses simplicity and reliability over guaranteed delivery. We want to provide a toolkit to develop micro services in an easy and powerful way. We provide a pattern matching RPC style. You don't have to worry about the transport. NATS is powerful. Efficient pattern matching to have the most flexibility in defining your RPC's. It doesn't matter where your server or client lives. You can add the same add as many as you want on different hosts to ensure maximal availability. The only dependency you have is a single binary of 7MB. Mind your own business NATS will do the rest for you.`,
        image: imgUrl('hemera-figure.png'),
        imageAlign: 'right',
        title: 'What is Hemera?'
      }
    ]}
  </Block>
)

const WhatIsNats = props => (
  <div
    className="productShowcaseSection paddingBottom"
    style={{ textAlign: 'center' }}
  >
    <h2 style={{ margin: '30px 0 30px 0' }}>What is NATS?</h2>
    <iframe
      width="40%"
      height="33%"
      src="https://www.youtube.com/embed/6uPopWEdldU?showinfo=0"
      frameborder="0"
      allow="autoplay; encrypted-media"
      allowfullscreen
    />
  </div>
)

const BeAware = props => (
  <Block background="dark">
    {[
      {
        content: `Hemera has not been designed for high performance on a single process. It has been designed to create lots of microservices doesn't matter where they live. It choose simplicity and reliability as primary goals. It act together with NATS as central nervous system of your distributed system. Transport independency was not considered to be a relevant factor. In addition we use pattern matching which is very powerful. The fact that Hemera needs a broker is an argument which should be taken into consideration when you compare hemera with other frameworks. The relevant difference between microservice frameworks like senecajs, moleculer is not the performance or modularity its about the complexity you need to manage. Hemera is expert in providing an interface to work with lots of services in the network, NATS is the expert to deliver the message at the right place. Hemera is still a subscriber of NATS with some magic in routing and extensions. We don't have to worry about all different aspects in a distributed system like routing, load-balancing, service-discovery, clustering, health-checks ...`,
        image: imgUrl('nodejs-rpc-frameworks.png'),
        imageAlign: 'right',
        title: 'Be aware of your requirements'
      }
    ]}
  </Block>
)

const Showcase = props => {
  if ((siteConfig.users || []).length === 0) {
    return null
  }
  const showcase = siteConfig.users
    .filter(user => {
      return user.pinned
    })
    .map((user, i) => {
      return (
        <a href={user.infoLink} key={i}>
          <img src={user.image} title={user.caption} />
        </a>
      )
    })

  return (
    <div className="productShowcaseSection paddingBottom">
      <h2>{"Who's Using This?"}</h2>
      <p>This project is used by all these people</p>
      <div className="logos">{showcase}</div>
      <div className="more-users">
        <a className="button" href={pageUrl('users.html', props.language)}>
          More {siteConfig.title} Users
        </a>
      </div>
    </div>
  )
}

class Index extends React.Component {
  render() {
    let language = this.props.language || ''

    return (
      <div>
        <HomeSplash language={language} />
        <div className="mainContainer">
          <Features />
          <FeatureCallout />
          <WhatIsHemera />
          <WhatIsNats />
          <BeAware />
          <Showcase language={language} />
        </div>
        <div className="iconLicenseContainer">
          Icons made by{' '}
          <a
            href="https://www.flaticon.com/authors/smartline"
            title="Smartline"
          >
            Smartline
          </a>{' '}
          from{' '}
          <a href="https://www.flaticon.com/" title="Flaticon">
            www.flaticon.com
          </a>{' '}
          is licensed by{' '}
          <a
            href="http://creativecommons.org/licenses/by/3.0/"
            title="Creative Commons BY 3.0"
            target="_blank"
          >
            CC 3.0 BY
          </a>
        </div>
      </div>
    )
  }
}

module.exports = Index
