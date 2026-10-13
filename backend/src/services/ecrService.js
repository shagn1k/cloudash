const { DescribeImagesCommand, DescribeRepositoriesCommand } = require('@aws-sdk/client-ecr');

const MAX_PAGES = 10; // a lifecycle policy keeps few images, this is only a safety net

/** ECR: which container images exist for this project and which was pushed most recently. */
function createEcrService({ client, aws }) {
  return {
    async getRepository() {
      if (!aws.ecrRepositoryName) return { configured: false };

      const repoResponse = await client.send(
        new DescribeRepositoriesCommand({ repositoryNames: [aws.ecrRepositoryName] }),
      );
      const repository = repoResponse.repositories?.[0];

      const images = [];
      let nextToken;
      for (let page = 0; page < MAX_PAGES; page += 1) {
        const response = await client.send(
          new DescribeImagesCommand({ repositoryName: aws.ecrRepositoryName, nextToken }),
        );
        images.push(...(response.imageDetails || []));
        nextToken = response.nextToken;
        if (!nextToken) break;
      }

      const latest = [...images].sort((a, b) => new Date(b.imagePushedAt) - new Date(a.imagePushedAt))[0];

      return {
        configured: true,
        repositoryName: repository?.repositoryName ?? aws.ecrRepositoryName,
        scanOnPush: repository?.imageScanningConfiguration?.scanOnPush ?? null,
        tagMutability: repository?.imageTagMutability ?? null,
        imageCount: images.length,
        latestImage: latest
          ? {
              tags: latest.imageTags || [],
              digest: latest.imageDigest,
              pushedAt: latest.imagePushedAt ? new Date(latest.imagePushedAt).toISOString() : null,
              sizeBytes: latest.imageSizeInBytes ?? null,
            }
          : null,
      };
    },
  };
}

module.exports = { createEcrService };
