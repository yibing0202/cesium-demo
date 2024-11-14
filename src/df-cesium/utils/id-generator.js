import SnowflakeId from "snowflake-id";

const snowflake = new SnowflakeId({
  mid: 42,
  offset: (2019 - 1970) * 31536000 * 1000,
});

export function getIdGenerator() {
  const id = snowflake.generate();

  return id;
}
