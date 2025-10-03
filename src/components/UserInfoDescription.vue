<template>
  <div class="user_info__description">
    <p id="i_d_p1">“</p>
    <span>欢迎~ <br />这里是香辛料的个人博客</span>
    <p id="i_d_p2">”</p>
  </div>
</template>

<style scoped>
.user_info__description {
  display: flex;
  /* height: 96px; */
  max-width: 372px;

  background: rgba(52, 55, 63, 0.568);
  border-radius: 8px;

  padding: 12px;
  padding-left: 5px;
  padding-right: 5px;
  margin-top: 30px;
  overflow: hidden;

  transition: transform 0.3s ease;
}

.user_info__description:hover {
  transform: scale(1.02);
}

.user_info__description span {
  max-width: 300px;
  /* height: 64px; */
  padding: 16px;

  font-size: 18px;
  line-height: 2rem;
  letter-spacing: 2px;
  color: #efefef;
}

.user_info__description p {
  margin: 0;
  color: #efefef;
  font-size: 20px;
  font-weight: 700;
}

.user_info__description #i_d_p2 {
  display: flex;
  align-items: end;
}
</style>
