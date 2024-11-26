#include <stdio.h>
#include <stdlib.h> 
#include <string.h>
#include <zlib.h>

void compress_word(const char *input, unsigned char **compressed, size_t *compressed_size, size_t *original_size)
{
  *original_size = strlen(input);                             
  size_t max_compressed_size = compressBound(*original_size);
  *compressed = (unsigned char *)malloc(max_compressed_size);
  int result = compress(*compressed, &max_compressed_size, (const unsigned char *)input, *original_size);
  if (result != Z_OK)
  {
    printf("not good %d\n", result);
    *compressed_size = 0;
    return;
  }
  *compressed_size = max_compressed_size; 
}

int main()
{
  const char *original_word = "Hierarchy";
  unsigned char *compressed_data = NULL;
  char *decompressed_data = NULL;
  size_t original_size, compressed_size;
  compress_word(original_word, &compressed_data, &compressed_size, &original_size);
  if (compressed_size > 0)
  {
    printf("org word: %s\n", original_word);
    printf("org size: %zu bytes\n", original_size);
    printf("compressd: %zu bytes\n", compressed_size);
    double compression_ratio = (1 - (double)compressed_size / original_size) * 100;
    printf("ratio: %.2f%%\n", compression_ratio);
  }
  free(compressed_data);
  return 0;
}
