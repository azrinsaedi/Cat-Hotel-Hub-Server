export const createCookie = ({ tokenName, tokenData, res }) => {
  const oneDay = 1000 * 60 * 60 * 24;
  res.cookie(tokenName, tokenData, {
    httpOnly: true,
    expires: new Date(Date.now() + oneDay),
    secure: process.env.NODE.ENV === "production",
  });
};

export const removeCookie = ({ tokenName, tokenData, res }) => {
  res.cookie(tokenName, tokenData, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
};
