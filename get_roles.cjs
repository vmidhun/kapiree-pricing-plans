const { api } = require('./src/lib/api');

async function getRoles() {
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMzNWI3NjI2LTkzMTYtNDlmNy04NTVkLWYwMmQyZTU1MTk4YiIsInJvbGUiOiJSZWNydWl0ZXIiLCJwZXJtaXNzaW9ucyI6WyJFZGl0IENhbmRpZGF0ZXMiLCJWaWV3IENhZGlkYXRlcyIsIlZpZXcgRGFzaGJvYXJkIiwiQ29uZHVjdCBJbnRlcnZpZXdzIiwiUmV2aWV3IEludGVydmlld3MiLCJTY2hlZHVsZSBJbnRlcnZpZXdzIiwiQ3JlYXRlIEpvYiBQb3NpdGlvbnMiLCJFZGl0IEpvYiBQb3NpdGlvbnMiLCJWaWV3IEpvYiBQb3NpdGlvbnMiXSwiaWF0IjoxNzU4Nzc0NTA4LCJleHAiOjE3NTg3NzgxMDh9.i7HIQALFh6nDRPMwmMCKTj73fgvdTvYTOZp4ULd9Wds';
    const response = await api.get('/api/auth/roles', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Roles:', response.roles);
  } catch (error) {
    console.error('Failed to fetch roles:', error.body || error.message);
  }
}
getRoles();
