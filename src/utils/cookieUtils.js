export const createCookie = ({ tokenName, tokenData, rememberMe, res }) => {
  const oneDay = 1000 * 60 * 60 * 24;
  const oneHour = 1000 * 60 * 60;
  let period;

  if (rememberMe === "on") {
    period = oneDay;
  } else {
    period = oneHour;
  }

  res.cookie(tokenName, tokenData, {
    httpOnly: true,
    expires: new Date(Date.now() + period),
    secure: process.env.NODE.ENV === "production",
  });
};

export const removeCookie = ({ tokenName, tokenData, res }) => {
  res.cookie(tokenName, tokenData, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
};
