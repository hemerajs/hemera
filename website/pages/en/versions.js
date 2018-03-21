/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react')

const CompLibrary = require('../../core/CompLibrary')
const Container = CompLibrary.Container
const GridBlock = CompLibrary.GridBlock

const CWD = process.cwd()

const siteConfig = require(CWD + '/siteConfig.js')
const versions = require(CWD + '/versions.json')

function docUrl(doc, language) {
  return siteConfig.baseUrl + 'docs/' + (language ? language + '/' : '') + doc
}

class Versions extends React.Component {
  render() {
    const latestVersion = versions[0]
    return (
      <div className="docMainWrapper wrapper">
        <Container className="mainContainer versionsContainer">
          <div className="post">
            <header className="postHeader">
              <h2>{siteConfig.title + ' Versions'}</h2>
            </header>
            <h3 id="rc">Pre-release versions</h3>
            <table className="versions">
              <tbody>
                <tr>
                  <th>{latestVersion}</th>
                  <td>
                    <a href={docUrl('request-reply.html')}>Documentation</a>
                  </td>
                  <td>
                    <a href="https://github.com/hemerajs/hemera/releases/tag/nats-hemera%405.0.0-rc.3">
                      Release Notes
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
            <p>
              You can find past versions of this project{' '}
              <a href="https://github.com/hemerajs/hemera/releases">
                {' '}
                on GitHub{' '}
              </a>.
            </p>
          </div>
        </Container>
      </div>
    )
  }
}

module.exports = Versions
