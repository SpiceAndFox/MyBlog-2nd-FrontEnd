<template>
  <nav class="user-info_contact-links">
    <a href="https://space.bilibili.com/102657225">
      <img src="@/assets/images/bilibili-01.svg" alt="哔哩哔哩" />
      <span>bilibili</span>
    </a>
    <a href="https://bangumi.tv/user/spicy">
      <img src="@/assets/images/bangumi-01.svg" alt="Bangumi" />
      <span>Bangumi</span>
    </a>
  </nav>
</template>

<style scoped>
.user-info_contact-links {
  height: 30px;
  display: flex;
  flex-direction: row;
  gap: 20px;
  align-items: center;

  padding: 8px;
  padding-left: 12px;
  background-color: #8686868c;
  border-radius: 15px;
  transition: background-color 0.4s ease;
}

.user-info_contact-links:hover {
  background-color: #5353538c;
}

.user-info_contact-links a {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 2px;

  text-decoration: none;
  color: rgb(221, 221, 221);
  transition: transform 0.3s ease;
}

.user-info_contact-links img {
  width: 24px;
  aspect-ratio: 1;
  object-fit: cover;
}

.user-info_contact-links a:hover {
  transform: scale(1.05);
}
</style>
