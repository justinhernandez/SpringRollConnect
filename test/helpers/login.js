import { browser } from './selenium';
import { LOGOUT_URL, ROOT_DOMAIN } from './urls';
import { until, By } from 'selenium-webdriver';

export async function logout() {
  await browser.get(LOGOUT_URL);
  await browser.wait(until.elementsLocated(By.className('form-login')));
}

export async function login({ username, password }) {
  // To make sure we are not already logged in, let's log out
  await logout();

  await browser.get(ROOT_DOMAIN);

  await browser.wait(until.elementsLocated(By.className('form-login')));

  // set the username field
  const [userInput, passwordInput] = await Promise.all([
    browser.findElement({
      name: 'username'
    }),
    browser.findElement({
      name: 'password'
    })
  ]);

  await Promise.all([
    userInput.sendKeys(username),
    passwordInput.sendKeys(password)
  ]);

  const form = await browser.findElement({ tagName: 'form' });
  await form.submit();
  await browser.get(ROOT_DOMAIN);
  await browser.wait(until.elementsLocated(By.css('a[href="/logout"]')));
}
